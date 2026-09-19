// pages/api/analyze.ts - run evidence pipeline for a workspace. Falls back to deterministic demo mapping when no GEMINI key.
import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "@/lib/supabaseClient";

export const config = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const { workspaceId } = req.body as { workspaceId?: string };
  if (!workspaceId) return res.status(400).json({ error: "Missing workspaceId" });
  if (!isSupabaseConfigured) {
    return res.status(500).json({ error: "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local." });
  }
  try {
    const { data: jobs } = await supabase.from("job_documents").select("id").eq("workspace_id", workspaceId).limit(1);
    const { data: resumeIds } = await supabase.from("candidate_documents").select("id").eq("workspace_id", workspaceId).limit(10);
    const jdRow = jobs?.[0];
    if (!jdRow) return res.status(400).json({ error: `No job description found in this workspace (${String(workspaceId).slice(0, 8)}…). Upload a JD in THIS workspace first, then Analyze.` });
    if (!resumeIds || resumeIds.length === 0) return res.status(400).json({ error: "No resumes found in this workspace. Upload resumes first." });
    const { data: jdFull } = await supabase.from("job_documents").select("content").eq("id", jdRow.id).single();
    const jdText: string = jdFull?.content?.text || "";
    if (!jdText.trim()) return res.status(400).json({ error: "Job description has no readable text. Try a text-based PDF." });
    const { data: resumeRows } = await supabase.from("candidate_documents").select("id,file_name,content").eq("workspace_id", workspaceId).limit(10);
    const resumes = resumeRows || [];

    if (!process.env.GEMINI_API_KEY) {
      // Deterministic fallback: keyword match, no hallucination.
      const skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"];
      const results = resumes.map((r: any) => {
        const text: string = r.content?.text || "";
        const evidence = skills.map((s) => ({
          requirement: s,
          status: text.toLowerCase().includes(s.toLowerCase()) ? "EVIDENCE FOUND" : "NO EVIDENCE FOUND",
          snippet: text.toLowerCase().includes(s.toLowerCase()) ? text.substring(text.toLowerCase().indexOf(s.toLowerCase()) - 40, text.toLowerCase().indexOf(s.toLowerCase()) + 80) : null,
        }));
        return { candidateId: r.id, fileName: r.file_name, evidence };
      });
      await supabase.from("audit_events").insert([{ workspace_id: workspaceId, event_type: "analyze_candidates", payload: { mode: "keyword-fallback", count: results.length } }]);
      return res.status(200).json({ mode: "keyword-fallback", message: "GEMINI_API_KEY missing - used deterministic keyword mapping.", results });
    }

    const { extractJobRequirements, analyzeCandidateOnce } = await import("@/lib/orchestrator");
    const requirements = await extractJobRequirements(jdText);
    const results = [];
    for (const r of resumes) {
      // ONE Gemini call per candidate (quota-friendly: 1 + N calls total).
      const { profile, mapping } = await analyzeCandidateOnce(requirements, r.content?.text || "");
      results.push({ candidateId: r.id, profile, mapping });
    }
    await supabase.from("audit_events").insert([{ workspace_id: workspaceId, event_type: "analyze_candidates", payload: { mode: "gemini", count: results.length } }]);
    return res.status(200).json({ mode: "gemini", requirements, results });
  } catch (e: any) {
    console.error("Analyze error:", e);
    if (e.message?.includes("GEMINI_RATE_LIMITED")) {
      return res.status(429).json({ error: "AI is rate-limited right now (free tier: 5 requests/min). Wait ~40 seconds and retry." });
    }
    return res.status(500).json({ error: e.message?.includes("GEMINI") ? "AI request failed. Check GEMINI_API_KEY and try again." : "Analysis failed. Try again." });
  }
}
