// pages/api/workspaces.ts - get-or-create workspace rows (FK parent for docs/audit).
import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "@/lib/supabaseClient";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isSupabaseConfigured) return res.status(500).json({ error: "Supabase not configured." });
  if (req.method === "GET") {
    const { id } = req.query as { id?: string };
    if (!id || !UUID_RE.test(id)) return res.status(400).json({ error: "Invalid workspace id" });
    const { data, error } = await supabase.from("workspaces").select("*").eq("id", id).single();
    if (error) return res.status(404).json({ error: "Workspace not found" });
    return res.status(200).json({ workspace: data });
  }
  if (req.method === "POST") {
    const { id, title } = req.body as { id?: string; title?: string };
    if (id && !UUID_RE.test(id)) return res.status(400).json({ error: "Invalid workspace id" });
    const row: any = { title: title || "Hiring workspace" };
    if (id) row.id = id;
    const q = id
      ? supabase.from("workspaces").upsert([row], { onConflict: "id" }).select().single()
      : supabase.from("workspaces").insert([row]).select().single();
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: "Failed to create workspace" });
    return res.status(200).json({ workspace: data });
  }
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
