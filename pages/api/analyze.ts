// pages/api/analyze.ts - run evidence pipeline, PERSIST canonical state.
import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "@/lib/supabaseClient";
import { normalizeRequirements, normalizeMapping, persistAnalysis, audit, slugKey, prettyName } from "@/lib/pipeline";

export const config = { maxDuration: 10 };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function runKeywordFallback(requirementsList: any[] | null, resumeRows: any[]) {
  const skills = requirementsList && requirementsList.length > 0
    ? requirementsList.map((r: any) => r.name || r.requirement)
    : ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"];

  const requirements = requirementsList && requirementsList.length > 0
    ? requirementsList
    : skills.map((s) => ({
        key: slugKey(s),
        name: s,
        category: "technical_skill",
        importance: "required",
        description: `Evidence of ${s} in supplied documents`,
      }));

  const perCandidate = (resumeRows || []).map((r: any) => {
    const text: string = r.content?.text || "";
    const low = text.toLowerCase();
    return {
      docId: r.id,
      fileName: r.file_name,
      evidence: skills.map((s) => {
        const i = low.indexOf(s.toLowerCase());
        const found = i >= 0;
        return {
          reqKey: slugKey(s),
          requirement: s,
          status: found ? "EVIDENCE FOUND" : "NO EVIDENCE FOUND",
          claim: found ? text.substring(Math.max(0, i - 60), Math.min(text.length, i + 100)).trim() : "",
          source: found ? r.file_name : "NO SOURCE EVIDENCE FOUND",
          observation: found ? "Keyword present in document; depth not yet established." : "No mention found in document.",
          question: found ? "" : `Can you describe any experience with ${s}?`,
        };
      }),
    };
  });

  return { requirements, perCandidate };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const { workspaceId } = req.body as { workspaceId?: string };
  if (!workspaceId || !UUID_RE.test(workspaceId)) return res.status(400).json({ error: "Invalid workspace" });
  if (!isSupabaseConfigured) return res.status(500).json({ error: "Supabase not configured." });

  let resumeRows: any[] = [];
  try {
    const { data: jobRows } = await supabase.from("job_documents").select("id,content").eq("workspace_id", workspaceId).limit(1);
    const { data: resumes } = await supabase.from("candidate_documents").select("id,file_name,content").eq("workspace_id", workspaceId).limit(10);
    resumeRows = resumes || [];

    const jdText: string = jobRows?.[0]?.content?.text || "";
    if (!jdText.trim()) return res.status(400).json({ error: `No job description found in this workspace (${workspaceId.slice(0, 8)}…). Upload a JD in THIS workspace first, then Analyze.` });
    if (resumeRows.length === 0) return res.status(400).json({ error: "No resumes found in this workspace. Upload resumes first." });

    await audit(workspaceId, "analysis_started", { candidates: resumeRows.length });

    const hasAI = Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.MISTRAL_API_KEY);
    if (!hasAI) {
      const { requirements, perCandidate } = runKeywordFallback(null, resumeRows);
      await persistAnalysis(workspaceId, requirements, perCandidate, "keyword-fallback");
      return res.status(200).json({ mode: "keyword-fallback", persisted: true, candidates: perCandidate.length });
    }

    try {
      const { extractJobRequirements, analyzeCandidateOnce } = await import("@/lib/orchestrator");
      const rawReqs = await extractJobRequirements(jdText);
      const requirements = normalizeRequirements(rawReqs, jdText);
      await audit(workspaceId, "requirements_extracted", { count: requirements.length });

      const perCandidate: any[] = [];
      for (let i = 0; i < resumeRows.length; i++) {
        if (i > 0) await delay(300); // 300ms spacing between requests to avoid burst rate-limits
        const r = resumeRows[i];
        const { profile, mapping } = await analyzeCandidateOnce(requirements, r.content?.text || "");
        await supabase.from("candidate_documents").update({
          display_name: prettyName(r.file_name, (profile as any)?.name),
        }).eq("id", r.id);
        perCandidate.push({ docId: r.id, fileName: r.file_name, evidence: normalizeMapping(mapping, requirements) });
      }

      const { gapCount } = await persistAnalysis(workspaceId, requirements, perCandidate, "gemini");
      await audit(workspaceId, "analysis_complete", { gaps: gapCount });
      return res.status(200).json({ mode: "gemini", persisted: true, requirements: requirements.length, candidates: perCandidate.length, gaps: gapCount });
    } catch (aiErr: any) {
      console.warn("AI Pipeline error, executing automatic keyword fallback:", aiErr.message);
      await audit(workspaceId, "analysis_ai_failed_fallback_triggered", { error: aiErr.message });

      const { requirements, perCandidate } = runKeywordFallback(null, resumeRows);
      const { gapCount } = await persistAnalysis(workspaceId, requirements, perCandidate, "keyword-fallback");
      await audit(workspaceId, "analysis_complete", { gaps: gapCount, fallback: true });
      return res.status(200).json({ mode: "keyword-fallback", persisted: true, requirements: requirements.length, candidates: perCandidate.length, gaps: gapCount });
    }
  } catch (e: any) {
    console.error("Analyze error:", e);
    return res.status(500).json({ error: e.message || "Analysis failed. Try again in a moment." });
  }
}
