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

  const [{ data: ws }, { data: reqs }, { data: docs }, { data: ev }, { data: interviews }, { data: events }, { data: jobDocs }] = await Promise.all([
    supabase.from("workspaces").select("id,title,created_at").eq("id", workspaceId).single(),
    supabase.from("job_requirements").select("*").eq("workspace_id", workspaceId).order("created_at"),
    supabase.from("candidate_documents").select("id,file_name,display_name,created_at").eq("workspace_id", workspaceId).order("created_at"),
    supabase.from("evidence_states").select("*").eq("workspace_id", workspaceId),
    supabase.from("interview_responses").select("*").eq("workspace_id", workspaceId).order("created_at"),
    supabase.from("audit_events").select("id,created_at,event_type,payload").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(50),
    supabase.from("job_documents").select("id,title,created_at").eq("workspace_id", workspaceId).order("created_at"),
  ]);

  const dispName = (d: any) => {
    const clean = String(d.display_name || "").trim();
    if (clean) return clean;
    const base = String(d.file_name || "").replace(/\.[^.]+$/, "");
    const stripped = base.replace(/^(EVIDENT[_-]?Test[_-]?Resume[_-]?|resume[_-]?)/i, "").replace(/[_-]+/g, " ").trim();
    return stripped.replace(/\b\w/g, (c) => c.toUpperCase()) || base;
  };

  const byDoc = new Map<string, any[]>();
  for (const e of ev || []) {
    if (!byDoc.has(e.candidate_doc_id)) byDoc.set(e.candidate_doc_id, []);
    byDoc.get(e.candidate_doc_id)!.push(e);
  }
  const candidates = (docs || []).map((d: any) => {
    const list = byDoc.get(d.id) || [];
    const isFound = (s: string) => s === "EVIDENCE FOUND" || s === "SUPPORTED BY INTERVIEW";
    const isReview = (s: string) => s === "PARTIAL EVIDENCE" || s === "NEEDS VALIDATION" || s === "CONFLICTING INFORMATION";
    const isNone = (s: string) => s === "NO EVIDENCE FOUND";
    const found = list.filter((e) => isFound(e.status)).length;
    const review = list.filter((e) => isReview(e.status)).length;
    const none = list.filter((e) => isNone(e.status)).length;
    const count = (s: string) => list.filter((e) => e.status === s).length;
    return {
      id: d.id, fileName: d.file_name, displayName: dispName(d), createdAt: d.created_at,
      evidence: list,
      gaps: list.filter((e) => e.status === "NEEDS VALIDATION" || e.status === "NO EVIDENCE FOUND"),
      groups: { found, review, none },
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
  const isFoundAll = (s: string) => s === "EVIDENCE FOUND" || s === "SUPPORTED BY INTERVIEW";
  const isReviewAll = (s: string) => s === "PARTIAL EVIDENCE" || s === "NEEDS VALIDATION" || s === "CONFLICTING INFORMATION";
  const stats = {
    candidates: candidates.length,
    requirements: (reqs || []).length,
    signals: all.filter((e) => isFoundAll(e.status)).length,
    gaps: all.filter((e) => isReviewAll(e.status) || e.status === "NO EVIDENCE FOUND").length,
  };
  return res.status(200).json({
    workspace: ws || null,
    requirements: reqs || [],
    jobDocs: jobDocs || [],
    candidates,
    interviews: interviews || [],
    activity: (events || []).map((a: any) => {
      // Human-readable audit labels: resolve ids to names, never raw keys.
      const p = a.payload || {};
      let label = "";
      if (p.reqKey || p.req_key) {
        const key = p.reqKey || p.req_key;
        const evRow = (ev || []).find((e: any) => e.req_key === key);
        const doc = (docs || []).find((d: any) =>
          d.id === p.candidateDocId || d.id === p.candidate_doc_id || d.id === evRow?.candidate_doc_id);
        const who = doc ? dispName(doc) : "";
        const what = evRow ? evRow.requirement : key;
        label = [who, what].filter(Boolean).join(" · ");
      }
      return { ...a, label };
    }),
    stats,
    analyzed: (reqs || []).length > 0,
  });
}
