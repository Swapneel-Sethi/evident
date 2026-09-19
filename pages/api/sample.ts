// pages/api/sample.ts - LOAD SAMPLE WORKSPACE through the REAL pipeline.
// Synthetic docs (labelled) are inserted then analyzed by the same persist path.
import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "@/lib/supabaseClient";
import { DEMO_JD, DEMO_CANDIDATES, DEMO_REQUIREMENTS } from "@/lib/demoData";
import { normalizeMapping, persistAnalysis, audit, prettyName } from "@/lib/pipeline";

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
        workspace_id: wid,
        file_name: `${c.person} (synthetic).txt`,
        display_name: c.person,
        content: { text: c.resumeText, source: { note: "synthetic sample" } },
      }]).select().single();
      if (data) docs.push({ id: data.id, fileName: data.file_name, text: c.resumeText });
    }
    await audit(wid, "sample_loaded", { candidates: docs.length });

    const requirements = DEMO_REQUIREMENTS;
    const perCandidate = docs.map((d, i) => ({
      docId: d.id,
      fileName: d.fileName,
      evidence: normalizeMapping(
        DEMO_CANDIDATES[i].evidence.map((e) => ({ ...e, reqKey: e.requirement.toLowerCase().replace(/[^a-z0-9]+/g, "") })),
        requirements
      ),
    }));

    await persistAnalysis(wid, requirements, perCandidate, "sample-synthetic");
    return res.status(200).json({ workspaceId: wid });
  } catch (e: any) {
    console.error("Sample error:", e);
    return res.status(500).json({ error: e.message || "Sample workspace failed. Try again in a moment." });
  }
}
