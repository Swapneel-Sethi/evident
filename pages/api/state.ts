// pages/api/state.ts - ONE canonical workspace state for every screen.
import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "@/lib/supabaseClient";
import { resolveCandidateRequirementState, slugKey } from "@/lib/pipeline";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["POST", "GET"]);
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

  const byDocEv = new Map<string, any[]>();
  for (const e of ev || []) {
    if (!byDocEv.has(e.candidate_doc_id)) byDocEv.set(e.candidate_doc_id, []);
    byDocEv.get(e.candidate_doc_id)!.push(e);
  }

  const byDocInt = new Map<string, any[]>();
  for (const i of interviews || []) {
    if (!byDocInt.has(i.candidate_doc_id)) byDocInt.set(i.candidate_doc_id, []);
    byDocInt.get(i.candidate_doc_id)!.push(i);
  }

  const roleRequirements = (reqs || []).map((r: any) => ({
    ...r,
    req_key: r.req_key || r.key || slugKey(r.name),
  }));

  const candidates = (docs || []).map((d: any) => {
    const docEvList = byDocEv.get(d.id) || [];
    const docIntList = byDocInt.get(d.id) || [];

    // Authoritative LEFT JOIN: Start with COMPLETE role requirement list
    const evidence = roleRequirements.map((r: any) => {
      const rKey = r.req_key;
      const eRow = docEvList.find((e: any) => e.req_key === rKey || (e.requirement && e.requirement.toLowerCase() === r.name.toLowerCase()));
      const iRow = docIntList.find((i: any) => i.req_key === rKey || (i.req_key && rKey && i.req_key.toLowerCase() === rKey.toLowerCase()));
      return resolveCandidateRequirementState(r, eRow, iRow);
    });

    const isFound = (s: string) => s === "EVIDENCE FOUND" || s === "SUPPORTED BY INTERVIEW";
    const isReview = (s: string) => s === "PARTIAL EVIDENCE" || s === "NEEDS VALIDATION" || s === "CONFLICTING INFORMATION";
    const isNone = (s: string) => s === "NO EVIDENCE FOUND";

    const found = evidence.filter((e) => isFound(e.status)).length;
    const review = evidence.filter((e) => isReview(e.status)).length;
    const none = evidence.filter((e) => isNone(e.status)).length;
    const count = (s: string) => evidence.filter((e) => e.status === s).length;

    return {
      id: d.id,
      fileName: d.file_name,
      displayName: dispName(d),
      createdAt: d.created_at,
      evidence,
      gaps: evidence.filter((e) => isReview(e.status) || isNone(e.status)),
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

  const totalReqs = roleRequirements.length;
  const totalFound = candidates.reduce((sum, c) => sum + c.groups.found, 0);
  const totalGaps = candidates.reduce((sum, c) => sum + c.groups.review + c.groups.none, 0);

  const stats = {
    candidates: candidates.length,
    requirements: totalReqs,
    signals: totalFound,
    gaps: totalGaps,
  };

  return res.status(200).json({
    workspace: ws || null,
    requirements: roleRequirements,
    jobDocs: jobDocs || [],
    candidates,
    interviews: interviews || [],
    activity: (events || []).map((a: any) => {
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
    analyzed: totalReqs > 0,
  });
}
