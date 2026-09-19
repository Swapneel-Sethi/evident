// pages/api/query.ts - Ask EVIDENT: NL query over the canonical evidence state.
import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "@/lib/supabaseClient";
import { audit } from "@/lib/pipeline";

const SKILLS = ["python", "fastapi", "postgresql", "docker", "aws", "redis", "terraform", "cicd", "kafka", "rabbitmq"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const { workspaceId, query } = req.body as { workspaceId?: string; query?: string };
  if (!workspaceId || !query?.trim()) return res.status(400).json({ error: "Ask about candidate evidence first." });
  if (!isSupabaseConfigured) return res.status(500).json({ error: "Supabase not configured." });

  const q = query.toLowerCase();
  const neg = /no |without|not |lacking|missing/.test(q);
  const mentioned = SKILLS.filter((s) => q.includes(s.replace("cicd", "ci/cd")) || (s === "cicd" && /ci\/cd|pipeline/.test(q)));
  const wanted = mentioned.filter((s) => {
    const i = q.indexOf(s === "cicd" ? "ci/cd" : s);
    const before = q.slice(Math.max(0, i - 14), i);
    return !/no |without |not |lacking |missing /.test(before);
  });
  const excluded = mentioned.filter((s) => !wanted.includes(s));

  const { data: docs } = await supabase.from("candidate_documents").select("id,file_name").eq("workspace_id", workspaceId).limit(20);
  const { data: ev } = await supabase.from("evidence_states").select("*").eq("workspace_id", workspaceId);
  const byDoc = new Map<string, any[]>();
  for (const e of ev || []) {
    if (!byDoc.has(e.candidate_doc_id)) byDoc.set(e.candidate_doc_id, []);
    byDoc.get(e.candidate_doc_id)!.push(e);
  }
  const has = (list: any[], skill: string) =>
    list.find((e) => e.requirement.toLowerCase().includes(skill) || e.req_key.includes(skill.replace("/", "")));
  const good = (e: any) => e && (e.status === "EVIDENCE FOUND" || e.status === "SUPPORTED BY INTERVIEW" || e.status === "PARTIAL EVIDENCE");

  const results = (docs || [])
    .map((d: any) => {
      const list = byDoc.get(d.id) || [];
      const all = [...wanted.map((s) => ({ skill: s, sought: "present" as const })), ...excluded.map((s) => ({ skill: s, sought: "absent" as const }))];
      const matchDetail = all.map(({ skill, sought }) => ({ skill, sought, evidence: has(list, skill) || null }));
      // Deterministic boolean filter on canonical evidence:
      // every wanted skill must have supporting evidence AND no excluded
      // skill may have supporting evidence.
      const wantedOk = wanted.every((s) => good(has(list, s)));
      const excludedOk = excluded.every((s) => !good(has(list, s)));
      const include = (wanted.length > 0 || excluded.length > 0) && wantedOk && excludedOk;
      return {
        candidateId: d.id, fileName: d.file_name, include,
        detail: matchDetail.map((m) => ({
          skill: m.skill, sought: m.sought,
          status: m.evidence?.status || "NO EVIDENCE FOUND",
          snippet: (m.evidence?.claim || "").slice(0, 220),
          source: m.evidence?.source || "NO SOURCE EVIDENCE FOUND",
        })),
      };
    })
    .filter((r) => r.include);

  await audit(workspaceId, "query_executed", { query: query.slice(0, 200), results: results.length });
  return res.status(200).json({ query, results });
}
