// pages/api/interview.ts - analyze a candidate answer (REAL AI), persist
// interview evidence, update the canonical evidence state, audit everything.
import type { NextApiRequest, NextApiResponse } from "next";
import supabase, { isSupabaseConfigured } from "@/lib/supabaseClient";
import { audit, normStatus } from "@/lib/pipeline";

export const config = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === "GET") {
    const { workspaceId, candidateDocId } = req.query as { workspaceId?: string; candidateDocId?: string };
    if (!workspaceId || !candidateDocId) {
      res.status(200).json({ questions: [] });
      return;
    }
    // Validation questions come from the persisted evidence state (real gaps).
    const { data } = await supabase.from("evidence_states")
      .select("req_key,requirement,question,status")
      .eq("workspace_id", workspaceId).eq("candidate_doc_id", candidateDocId)
      .in("status", ["NEEDS VALIDATION", "PARTIAL EVIDENCE"]);
    res.status(200).json({ questions: (data || []).filter((q: any) => q.question).map((q: any) => ({ reqKey: q.req_key, requirement: q.requirement, question: q.question })) });
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const { response, interviewPlan, workspaceId, candidateDocId, reqKey, requirement, question, answer } =
    req.body as any;
  const candidateAnswer: string = answer || response || "";
  const currentQuestion: string = question || interviewPlan?.question || "Interview question";
  if (!candidateAnswer.trim()) {
    res.status(400).json({ error: "Missing candidate answer" });
    return;
  }

  try {
    const { analyzeInterviewResponse, generateFollowUp } = await import("@/lib/orchestrator");
    const analysis = await analyzeInterviewResponse(candidateAnswer, interviewPlan || { requirement: requirement || "", question: currentQuestion });
    const followUp = await generateFollowUp(analysis);

    let newStatus: string | null = null;
    if (workspaceId && candidateDocId && reqKey && isSupabaseConfigured) {
      const satisfied = Boolean((analysis as any)?.satisfied);
      const hasEvidence = Boolean((analysis as any)?.evidence);
      newStatus = satisfied ? "SUPPORTED BY INTERVIEW" : hasEvidence ? "PARTIAL EVIDENCE" : null;
      await supabase.from("interview_responses").insert([{
        workspace_id: workspaceId, candidate_doc_id: candidateDocId, req_key: reqKey,
        question: currentQuestion, answer: candidateAnswer,
        analysis, follow_up: (followUp as any)?.followUpQuestion || (followUp as any)?.follow_up || "",
      }]);
      await audit(workspaceId, "response_analyzed", { reqKey, satisfied });
      if (newStatus) {
        await supabase.from("evidence_states").update({
          status: newStatus,
          observation: `Interview: ${String((analysis as any)?.notes || (analysis as any)?.observation || "response recorded").slice(0, 400)}`,
          updated_at: new Date().toISOString(),
        }).eq("workspace_id", workspaceId).eq("candidate_doc_id", candidateDocId).eq("req_key", reqKey);
        await audit(workspaceId, "evidence_updated", { reqKey, newStatus });
      }
      if ((followUp as any)?.followUpQuestion || (followUp as any)?.follow_up) {
        await audit(workspaceId, "followup_generated", { reqKey });
      }
    }
    res.status(200).json({ analysis, followUp, newStatus });
  } catch (error: any) {
    console.error("Interview processing error:", error);
    if (error?.message?.includes("GEMINI_RATE_LIMITED")) {
      res.status(429).json({ error: "AI is rate-limited right now (free tier: 5 requests/min). Wait ~40 seconds and submit again." });
      return;
    }
    res.status(500).json({ error: "Response analysis failed. Your notes are safe - try again in a moment." });
  }
}
