// pages/api/sample.ts - LOAD SAMPLE WORKSPACE through the REAL pipeline.
// Synthetic docs (labelled) are inserted then analyzed by the same persist path.
import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "@/lib/supabaseClient";
import { DEMO_JD, DEMO_CANDIDATES } from "@/lib/demoData";
import { normalizeRequirements, normalizeMapping, persistAnalysis, audit, slugKey, prettyName } from "@/lib/pipeline";

export const config = { maxDuration: 10 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  if (!isSupabaseConfigured) return res.status(500).json({ error: "Supabase not configured." });
  try {
    const { data: ws, error: wsErr } = await supabase.from("workspaces").insert([{ title: "Sample workspace (synthetic)" }]).select().single();
    if (wsErr) throw wsErr;
    const wid = ws.id as string;
    await supabase.from("job_documents").insert([{ workspace_id: wid, title: "Sample Backend JD (synthetic)", content: { text: DEMO_JD, source: { note: "synthetic sample" } } }]);
    const docs: { id: string; fileName: string; text: string }[] = [];
    for (const c of DEMO_CANDIDATES) {
      const { data } = await supabase.from("candidate_documents").insert([{
        workspace_id: wid, file_name: `${c.person} (synthetic).txt`,
        content: { text: c.resumeText, source: { note: "synthetic sample" } },
      }]).select().single();
      if (data) docs.push({ id: data.id, fileName: data.file_name, text: c.resumeText });
    }
    await audit(wid, "sample_loaded", { candidates: docs.length });

    const hasAI = Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.MISTRAL_API_KEY);
    if (!hasAI) {
      const skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"];
      const requirements = skills.map((s) => ({ key: slugKey(s), name: s, category: "technical_skill", importance: "required", description: `Evidence of ${s}` }));
      const perCandidate = docs.map((d, i) => ({
        docId: d.id, fileName: d.fileName,
        evidence: normalizeMapping(DEMO_CANDIDATES[i].evidence.map((e) => ({ ...e, requirementId: slugKey(e.requirement) })), requirements),
      }));
      await persistAnalysis(wid, requirements, perCandidate, "sample-synthetic");
      return res.status(200).json({ workspaceId: wid });
    }

    const abortController = new AbortController();
    const aiPromise = (async () => {
      const { analyzeWorkspaceCombined } = await import("@/lib/orchestrator");
      const { requirements: rawReqs, candidates: rawCands } = await analyzeWorkspaceCombined(DEMO_JD, docs, abortController.signal);
      const requirements = normalizeRequirements(rawReqs, DEMO_JD);

      const perCandidate = [];
      for (const rawC of rawCands) {
        const docId = rawC.docId || docs.find((d) => d.fileName === rawC.fileName)?.id || docs[0]?.id;
        const dRow = docs.find((d) => d.id === docId);
        const fileName = dRow?.fileName || rawC.fileName || "resume.txt";
        if (rawC.name) {
          await supabase.from("candidate_documents").update({ display_name: prettyName(fileName, rawC.name) }).eq("id", docId);
        }
        perCandidate.push({ docId, fileName, evidence: normalizeMapping(rawC.evidence || [], requirements) });
      }

      for (const d of docs) {
        if (!perCandidate.some((c) => c.docId === d.id)) {
          perCandidate.push({ docId: d.id, fileName: d.fileName, evidence: normalizeMapping([], requirements) });
        }
      }

      await persistAnalysis(wid, requirements, perCandidate, "sample-ai");
      return { workspaceId: wid };
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI_DEADLINE_EXCEEDED")), 4500)
    );

    try {
      const result: any = await Promise.race([aiPromise, timeoutPromise]);
      return res.status(200).json(result);
    } catch (aiErr: any) {
      abortController.abort();
      console.warn("Sample AI pipeline exceeded deadline or failed, using synthetic fallback:", aiErr.message);

      const skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"];
      const requirements = skills.map((s) => ({ key: slugKey(s), name: s, category: "technical_skill", importance: "required", description: `Evidence of ${s}` }));
      const perCandidate = docs.map((d, i) => ({
        docId: d.id, fileName: d.fileName,
        evidence: normalizeMapping(DEMO_CANDIDATES[i].evidence.map((e) => ({ ...e, requirementId: slugKey(e.requirement) })), requirements),
      }));
      await persistAnalysis(wid, requirements, perCandidate, "sample-synthetic-fallback");
      return res.status(200).json({ workspaceId: wid });
    }
  } catch (e: any) {
    console.error("Sample error:", e);
    return res.status(500).json({ error: e.message || "Sample workspace failed. Try again in a moment." });
  }
}
