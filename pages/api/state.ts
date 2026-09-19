// pages/api/state.ts - ONE canonical workspace state for every screen.
import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "@/lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const { workspaceId } = req.query as { workspaceId?: string };
  if (!workspaceId) return res.status(400).json({ error: "Missing workspaceId" });
  if (!isSupabaseConfigured) return res.status(500).json({ error: "Supabase not configured." });

  const [{ data: ws }, { data: reqs }, { data: docs }, { data: ev }, { data: interviews }, { data: events }] = await Promise.all([
    supabase.from("workspaces").select("id,title,created_at").eq("id", workspaceId).single(),
    supabase.from("job_requirements").select("*").eq("workspace_id", workspaceId).order("created_at"),
    supabase.from("candidate_documents").select("id,file_name,created_at").eq("workspace_id", workspaceId).order("created_at"),
    supabase.from("evidence_states").select("*").eq("workspace_id", workspaceId),
    supabase.from("interview_responses").select("id,candidate_doc_id,req_key,question,created_at").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(50),
    supabase.from("audit_events").select("id,created_at,event_type,payload").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(50),
  ]);

  const byDoc = new Map<string, any[]>();
  for (const e of ev || []) {
    if (!byDoc.has(e.candidate_doc_id)) byDoc.set(e.candidate_doc_id, []);
    byDoc.get(e.candidate_doc_id)!.push(e);
  }
  const candidates = (docs || []).map((d: any) => {
    const list = byDoc.get(d.id) || [];
    const count = (s: string) => list.filter((e) => e.status === s).length;
    return {
      id: d.id, fileName: d.file_name, createdAt: d.created_at,
      evidence: list,
      gaps: list.filter((e) => e.status === "NEEDS VALIDATION" || e.status === "NO EVIDENCE FOUND"),
      counts: {
        found: count("EVIDENCE FOUND"),
        partial: count("PARTIAL EVIDENCE"),
        validate: count("NEEDS VALIDATION"),
        none: count("NO EVIDENCE FOUND"),
        interview: count("SUPPORTED BY INTERVIEW"),
      },
    };
  });
  const all = ev || [];
  const stats = {
    candidates: candidates.length,
    requirements: (reqs || []).length,
    signals: all.filter((e) => e.status === "EVIDENCE FOUND" || e.status === "SUPPORTED BY INTERVIEW").length,
    gaps: all.filter((e) => e.status === "NEEDS VALIDATION" || e.status === "NO EVIDENCE FOUND").length,
  };
  return res.status(200).json({
    workspace: ws || null,
    requirements: reqs || [],
    candidates,
    interviews: interviews || [],
    activity: events || [],
    stats,
    analyzed: (reqs || []).length > 0,
  });
}
