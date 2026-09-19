// pages/api/sample.ts - LOAD SAMPLE WORKSPACE through the REAL pipeline.
// Synthetic docs (labelled) are inserted then analyzed by the same persist path.
import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "@/lib/supabaseClient";
import { DEMO_JD, DEMO_CANDIDATES } from "@/lib/demoData";
import { normalizeRequirements, normalizeMapping, persistAnalysis, audit, slugKey, prettyName } from "@/lib/pipeline";

export const config = { maxDuration: 60 };

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
      return res.status(200).json({ workspaceId: wid, mode: "sample-synthetic" });
    }
    const { extractJobRequirements, analyzeCandidateOnce } = await import("@/lib/orchestrator");
    const requirements = normalizeRequirements(await extractJobRequirements(DEMO_JD), DEMO_JD);
    const perCandidate = [];
    for (const d of docs) {
      const { profile, mapping } = await analyzeCandidateOnce(requirements, d.text);
      await supabase.from("candidate_documents").update({
        display_name: prettyName(d.fileName, (profile as any)?.name),
      }).eq("id", d.id);
      perCandidate.push({ docId: d.id, fileName: d.fileName, evidence: normalizeMapping(mapping, requirements) });
    }
    await persistAnalysis(wid, requirements, perCandidate, "sample-ai");
    return res.status(200).json({ workspaceId: wid, mode: "sample-ai" });
  } catch (e: any) {
    console.error("Sample error:", e);
    if (e.message?.includes("GEMINI_RATE_LIMITED")) {
      return res.status(429).json({ error: "AI is rate-limited right now. Wait ~40 seconds and retry." });
    }
    return res.status(500).json({ error: "Sample workspace failed. Try again in a moment." });
  }
}
