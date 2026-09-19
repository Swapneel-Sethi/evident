// lib/pipeline.ts - canonical evidence pipeline. Single writer of
// job_requirements + evidence_states. Used by /api/analyze and /api/sample.
import supabase from "@/lib/supabaseClient";

export const CANON_STATUSES = [
  "EVIDENCE FOUND",
  "PARTIAL EVIDENCE",
  "NEEDS VALIDATION",
  "NO EVIDENCE FOUND",
  "SUPPORTED BY INTERVIEW",
  "CONFLICTING INFORMATION",
] as const;

export function slugKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60) || "req";
}

export function normStatus(s: any): string {
  const t = String(s || "").toUpperCase();
  if (t.includes("SUPPORT") && t.includes("INTERVIEW")) return "SUPPORTED BY INTERVIEW";
  if (t.includes("CONFLICT")) return "CONFLICTING INFORMATION";
  if (t.includes("PARTIAL")) return "PARTIAL EVIDENCE";
  if (t.includes("NEEDS") || t.includes("VALIDAT")) return "NEEDS VALIDATION";
  if (t.includes("NO EVIDENCE") || t === "NO" || t.includes("NOT ADDRESSED") || t.includes("MISSING")) return "NO EVIDENCE FOUND";
  if (t.includes("FOUND") || t === "EVIDENCE" || t === "PASS" || t === "YES") return "EVIDENCE FOUND";
  return "NEEDS VALIDATION";
}

export type ReqRow = { key: string; name: string; category: string; importance: string; description: string };
export type EvRow = {
  reqKey: string; requirement: string; status: string;
  claim: string; source: string; observation: string; question: string;
};

export function normalizeRequirements(raw: any, jdText: string): ReqRow[] {
  const arr: any[] = Array.isArray(raw) ? raw : raw?.requirements || [];
  return arr.slice(0, 12).map((r: any, i: number) => {
    const name = String(r.name || r.title || r.requirement || `Requirement ${i + 1}`);
    return {
      key: String(r.id || r.key || "") || slugKey(name),
      name,
      category: String(r.category || "general"),
      importance: /prefer/i.test(String(r.importance || "")) ? "preferred" : "required",
      description: String(r.description || "").slice(0, 500),
    };
  });
}

export function normalizeMapping(raw: any, fallbackReqs: ReqRow[]): EvRow[] {
  const arr: any[] = Array.isArray(raw) ? raw : raw?.mapping || raw?.evidence || [];
  const byKey = new Map(arr.map((m: any) => [String(m.requirementId || m.requirement || m.reqKey || "").toLowerCase(), m]));
  return fallbackReqs.map((req) => {
    const m: any = byKey.get(req.key.toLowerCase()) || byKey.get(req.name.toLowerCase()) || {};
    return {
      reqKey: req.key,
      requirement: req.name,
      status: normStatus(m.status),
      claim: String(m.claim || m.evidence || "").slice(0, 800),
      source: String(m.source || "").slice(0, 300),
      observation: String(m.observation || m.notes || "").slice(0, 500),
      question: String(m.question || m.validationQuestion || "").slice(0, 500),
    };
  });
}

export async function persistAnalysis(
  workspaceId: string,
  requirements: ReqRow[],
  perCandidate: { docId: string; fileName: string; evidence: EvRow[] }[],
  mode: string
) {
  for (const r of requirements) {
    await supabase.from("job_requirements").upsert([{
      workspace_id: workspaceId, req_key: r.key, name: r.name,
      category: r.category, importance: r.importance, description: r.description,
    }], { onConflict: "workspace_id,req_key" });
  }
  let gapCount = 0;
  for (const c of perCandidate) {
    for (const e of c.evidence) {
      if (e.status === "NEEDS VALIDATION" || e.status === "NO EVIDENCE FOUND") gapCount++;
      await supabase.from("evidence_states").upsert([{
        workspace_id: workspaceId, candidate_doc_id: c.docId, req_key: e.reqKey,
        requirement: e.requirement, status: e.status, claim: e.claim,
        source: e.source || (e.status === "NO EVIDENCE FOUND" ? "NO SOURCE EVIDENCE FOUND" : c.fileName),
        observation: e.observation, question: e.question,
      }], { onConflict: "workspace_id,candidate_doc_id,req_key" });
    }
  }
  await supabase.from("audit_events").insert([{
    workspace_id: workspaceId, event_type: "evidence_mapped",
    payload: { mode, requirements: requirements.length, candidates: perCandidate.length, gaps: gapCount },
  }]);
  return { gapCount };
}

export async function audit(workspaceId: string, type: string, payload: any) {
  await supabase.from("audit_events").insert([{ workspace_id: workspaceId, event_type: type, payload }]);
}

/** Display name: AI-extracted name wins; else prettified filename. */
export function prettyName(fileName: string, aiName?: string): string {
  const clean = String(aiName || "").trim();
  if (/^[A-Za-z][A-Za-z .'-]{1,60}$/.test(clean) && !/synthetic|test|resume|curriculum/i.test(clean)) return clean;
  const base = fileName.replace(/\.[^.]+$/, "");
  const stripped = base.replace(/^(EVIDENT[_-]?Test[_-]?Resume[_-]?|resume[_-]?)/i, "").replace(/[_-]+/g, " ").trim();
  const titled = stripped.replace(/\b\w/g, (c) => c.toUpperCase());
  return titled || base;
}
