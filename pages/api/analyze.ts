// pages/api/analyze.ts - run evidence pipeline, PERSIST canonical state.
import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "@/lib/supabaseClient";
import { normalizeRequirements, normalizeMapping, persistAnalysis, audit, slugKey, prettyName } from "@/lib/pipeline";

export const config = { maxDuration: 60 };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const { workspaceId } = req.body as { workspaceId?: string };
  if (!workspaceId || !UUID_RE.test(workspaceId)) return res.status(400).json({ error: "Invalid workspace" });
  if (!isSupabaseConfigured) return res.status(500).json({ error: "Supabase not configured." });
  try {
    const { data: jobRows } = await supabase.from("job_documents").select("id,content").eq("workspace_id", workspaceId).limit(1);
    const { data: resumeRows } = await supabase.from("candidate_documents").select("id,file_name,content").eq("workspace_id", workspaceId).limit(10);
    const jdText: string = jobRows?.[0]?.content?.text || "";
    if (!jdText.trim()) return res.status(400).json({ error: `No job description found in this workspace (${workspaceId.slice(0, 8)}…). Upload a JD in THIS workspace first, then Analyze.` });
    if (!resumeRows || resumeRows.length === 0) return res.status(400).json({ error: "No resumes found in this workspace. Upload resumes first." });

    await audit(workspaceId, "analysis_started", { candidates: resumeRows.length });

    if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY && !process.env.MISTRAL_API_KEY) {
      const skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"];
      const requirements = skills.map((s) => ({ key: slugKey(s), name: s, category: "technical_skill", importance: "required", description: `Evidence of ${s} in supplied documents` }));
      const perCandidate = (resumeRows || []).map((r: any) => {
        const text: string = r.content?.text || "";
        const low = text.toLowerCase();
        return {
          docId: r.id, fileName: r.file_name,
          evidence: skills.map((s) => {
            const i = low.indexOf(s.toLowerCase());
            const found = i >= 0;
            return {
              reqKey: slugKey(s), requirement: s,
              status: found ? "EVIDENCE FOUND" : "NO EVIDENCE FOUND",
              claim: found ? text.substring(Math.max(0, i - 60), i + 100).trim() : "",
              source: found ? r.file_name : "NO SOURCE EVIDENCE FOUND",
              observation: found ? "Keyword present in document; depth not yet established." : "No mention found in document.",
              question: found ? "" : `Can you describe any experience with ${s}?`,
            };
          }),
        };
      });
      await persistAnalysis(workspaceId, requirements, perCandidate, "keyword-fallback");
      return res.status(200).json({ mode: "keyword-fallback", persisted: true, candidates: perCandidate.length });
    }

    const { extractJobRequirements, analyzeCandidateOnce } = await import("@/lib/orchestrator");
    const rawReqs = await extractJobRequirements(jdText);
    const requirements = normalizeRequirements(rawReqs, jdText);
    await audit(workspaceId, "requirements_extracted", { count: requirements.length });
    const perCandidate = [];
    for (const r of resumeRows) {
      // ONE Gemini call per candidate (quota-friendly: 1 + N calls total).
      const { profile, mapping } = await analyzeCandidateOnce(requirements, r.content?.text || "");
      await supabase.from("candidate_documents").update({
        display_name: prettyName(r.file_name, (profile as any)?.name),
      }).eq("id", r.id);
      perCandidate.push({ docId: r.id, fileName: r.file_name, evidence: normalizeMapping(mapping, requirements) });
    }
    const { gapCount } = await persistAnalysis(workspaceId, requirements, perCandidate, "gemini");
    await audit(workspaceId, "analysis_complete", { gaps: gapCount });
    return res.status(200).json({ mode: "gemini", persisted: true, requirements: requirements.length, candidates: perCandidate.length, gaps: gapCount });
  } catch (e: any) {
    console.error("Analyze error:", e);
    if (e.message?.includes("GEMINI_RATE_LIMITED")) {
      return res.status(429).json({ error: "AI is rate-limited right now (free tier: 5 requests/min). Wait ~40 seconds and retry." });
    }
    return res.status(500).json({ error: "Analysis failed. Your files are safe - try again in a moment." });
  }
}
