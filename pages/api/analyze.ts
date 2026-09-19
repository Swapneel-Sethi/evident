// pages/api/analyze.ts - run evidence pipeline for a workspace. Falls back to deterministic demo mapping when no GEMINI key.
import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "@/lib/supabaseClient";

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
    const { data: jobs } = await supabase.from("job_documents").select("*").eq("workspace_id", workspaceId).limit(1);
    const { data: resumes } = await supabase.from("candidate_documents").select("*").eq("workspace_id", workspaceId).limit(10);
    const jdText: string = jobs?.[0]?.content?.text || "";
    if (!jdText) return res.status(400).json({ error: "No job description found. Upload a JD first." });
    if (!resumes || resumes.length === 0) return res.status(400).json({ error: "No resumes found. Upload resumes first." });

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

    const { extractJobRequirements, extractCandidateProfile, mapCandidateEvidence } = await import("@/lib/orchestrator");
    const requirements = await extractJobRequirements(jdText);
    const results = [];
    for (const r of resumes) {
      const profile = await extractCandidateProfile(r.content?.text || "");
      const mapping = await mapCandidateEvidence(profile, requirements);
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
