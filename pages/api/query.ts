// pages/api/query.ts - natural-language pool query. Keyword fallback when no Gemini key.
import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "@/lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const { workspaceId, query } = req.body as { workspaceId?: string; query?: string };
  if (!workspaceId || !query) return res.status(400).json({ error: "Missing workspaceId or query" });
  if (!isSupabaseConfigured) return res.status(500).json({ error: "Supabase not configured." });
  const { data: resumes } = await supabase.from("candidate_documents").select("id,file_name,content").eq("workspace_id", workspaceId).limit(20);
  const q = query.toLowerCase();
  const mustHave = ["python", "fastapi", "postgresql", "docker", "aws"].filter((s) => q.includes(s));
  const results = (resumes || []).map((r: any) => {
    const text = (r.content?.text || "").toLowerCase();
    const hits = mustHave.filter((s) => text.includes(s));
    return { candidateId: r.id, fileName: r.file_name, matched: hits, snippet: (r.content?.text || "").substring(0, 200) };
  }).filter((r: any) => (mustHave.length === 0 ? true : r.matched.length > 0));
  return res.status(200).json({ query, mustHave, results });
}
