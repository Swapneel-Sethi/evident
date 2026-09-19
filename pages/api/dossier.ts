// pages/api/dossier.ts - return candidate dossier from Supabase
import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "@/lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const { workspaceId, candidateId } = req.query as { workspaceId?: string; candidateId?: string };
  if (!workspaceId || !candidateId) return res.status(400).json({ error: "Missing workspaceId or candidateId" });
  if (!isSupabaseConfigured) return res.status(500).json({ error: "Supabase not configured." });
  const { data: doc, error } = await supabase.from("candidate_documents").select("*").eq("id", candidateId).single();
  if (error) return res.status(404).json({ error: "Candidate not found" });
  return res.status(200).json({ candidate: { id: doc.id, name: doc.file_name, email: "" }, requirements: [], evidence: [], gaps: [] });
}
