// lib/pipeline.ts - Canonical pipeline helpers & bulk persistence.
import supabase from "./supabaseClient";

export function slugKey(name: string): string {
  const s = String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || `req-${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeRequirements(raw: any, jobText: string) {
  const list = Array.isArray(raw) ? raw : ((raw as any)?.requirements || []);
  const arr = list.map((r: any) => {
    const name = String(r.name || r.title || r.requirement || "").trim();
    return {
      key: slugKey(r.id || r.key || name),
      name: name || "Requirement",
      category: String(r.category || "technical_skill"),
      importance: String(r.importance || "required"),
      description: String(r.description || `Evidence of ${name}`),
    };
  }).filter((r: any) => r.name);

  if (arr.length > 0) return arr;

  const fallbackSkills = ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"];
  const low = jobText.toLowerCase();
  const matched = fallbackSkills.filter((s) => low.includes(s.toLowerCase()));
  const finalSkills = matched.length > 0 ? matched : fallbackSkills;

  return finalSkills.map((s) => ({
    key: slugKey(s),
    name: s,
    category: "technical_skill",
    importance: "required",
    description: `Evidence of ${s} in supplied documents`,
  }));
}

export function normalizeMapping(mapping: any[], requirements: any[]) {
  const mapList = Array.isArray(mapping) ? mapping : [];
  return requirements.map((req) => {
    const found = mapList.find((m: any) => {
      const mk = slugKey(m.requirementId || m.reqKey || m.requirement || "");
      return mk === req.key || (m.requirement && String(m.requirement).toLowerCase() === req.name.toLowerCase());
    });
    if (!found) {
      return {
        reqKey: req.key,
        requirement: req.name,
        status: "NO EVIDENCE FOUND",
        claim: "",
        source: "NO SOURCE EVIDENCE FOUND",
        observation: "No mention found in document.",
        question: `Can you describe your experience with ${req.name}?`,
      };
    }
    const rawStatus = String(found.status || "").toUpperCase();
    let status = "NO EVIDENCE FOUND";
    if (rawStatus.includes("EVIDENCE FOUND") && !rawStatus.includes("NO ")) status = "EVIDENCE FOUND";
    else if (rawStatus.includes("PARTIAL")) status = "PARTIAL EVIDENCE";
    else if (rawStatus.includes("VALIDATION") || rawStatus.includes("NEEDS")) status = "NEEDS VALIDATION";
    else if (rawStatus.includes("SUPPORTED")) status = "SUPPORTED BY INTERVIEW";

    return {
      reqKey: req.key,
      requirement: req.name,
      status,
      claim: String(found.claim || "").trim(),
      source: String(found.source || found.source_doc || "").trim() || (status === "NO EVIDENCE FOUND" ? "NO SOURCE EVIDENCE FOUND" : "Resume"),
      observation: String(found.observation || "").trim() || (status === "EVIDENCE FOUND" ? "Document establishes capability." : "Needs validation."),
      question: String(found.question || "").trim() || (status !== "EVIDENCE FOUND" ? `Can you describe your experience with ${req.name}?` : ""),
    };
  });
}

/**
 * Bulk persist analysis results in 2 quick Supabase batch calls.
 */
export async function persistAnalysis(
  workspaceId: string,
  requirements: { key: string; name: string; category: string; importance: string; description: string }[],
  perCandidate: { docId: string; fileName: string; evidence: any[] }[],
  mode: string
) {
  const reqRows = requirements.map((r) => ({
    workspace_id: workspaceId,
    req_key: r.key,
    name: r.name,
    category: r.category,
    importance: r.importance,
    description: r.description,
  }));

  if (reqRows.length > 0) {
    await supabase.from("job_requirements").upsert(reqRows, { onConflict: "workspace_id,req_key" });
  }

  let gapCount = 0;
  const evRows: any[] = [];
  for (const c of perCandidate) {
    for (const e of c.evidence) {
      if (e.status !== "EVIDENCE FOUND" && e.status !== "SUPPORTED BY INTERVIEW") gapCount++;
      const aiSection = String(e.source || "").trim();
      const isFileLike = !aiSection || /\.pdf$|\.txt$/i.test(aiSection) || aiSection === c.fileName;
      evRows.push({
        workspace_id: workspaceId,
        candidate_doc_id: c.docId,
        req_key: e.reqKey,
        requirement: e.requirement,
        status: e.status,
        claim: e.claim,
        source: e.source || (e.status === "NO EVIDENCE FOUND" ? "NO SOURCE EVIDENCE FOUND" : c.fileName),
        source_doc: c.fileName,
        source_section: isFileLike ? "" : aiSection.slice(0, 200),
        observation: e.observation,
        question: e.question,
      });
    }
  }

  if (evRows.length > 0) {
    await supabase.from("evidence_states").upsert(evRows, { onConflict: "workspace_id,candidate_doc_id,req_key" });
  }

  await supabase.from("audit_events").insert([{
    workspace_id: workspaceId,
    event_type: "evidence_mapped",
    payload: { mode, requirements: requirements.length, candidates: perCandidate.length, gaps: gapCount },
  }]);

  return { gapCount };
}

export async function audit(workspaceId: string, type: string, payload: any) {
  await supabase.from("audit_events").insert([{ workspace_id: workspaceId, event_type: type, payload }]);
}

export function normStatus(rawStatus: string): string {
  const s = String(rawStatus || "").toUpperCase();
  if (s.includes("EVIDENCE FOUND") && !s.includes("NO ")) return "EVIDENCE FOUND";
  if (s.includes("PARTIAL")) return "PARTIAL EVIDENCE";
  if (s.includes("VALIDATION") || s.includes("NEEDS")) return "NEEDS VALIDATION";
  if (s.includes("SUPPORTED")) return "SUPPORTED BY INTERVIEW";
  return "NO EVIDENCE FOUND";
}

export function dequote(s: string): string {
  const t = String(s || "").trim();
  if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")) || (t.startsWith("\u201c") && t.endsWith("\u201d")))) {
    return t.slice(1, -1).trim();
  }
  return t;
}

export function prettyName(fileName: string, aiName?: string): string {
  const clean = String(aiName || "").trim();
  if (/^[A-Za-z][A-Za-z .'-]{1,60}$/.test(clean) && !/synthetic|test|resume|curriculum/i.test(clean)) return clean;
  const base = fileName.replace(/\.[^.]+$/, "");
  const stripped = base.replace(/^(EVIDENT[_-]?Test[_-]?Resume[_-]?|resume[_-]?)/i, "").replace(/[_-]+/g, " ").trim();
  const titled = stripped.replace(/\b\w/g, (c) => c.toUpperCase());
  return titled || base;
}
