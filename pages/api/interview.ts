// pages/api/interview.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { analyzeInterviewResponse, generateFollowUp } from "../../lib/orchestrator";

/**
 * API route for interview workflow.
 *
 * GET  – returns a static list of interview questions.
 * POST – expects a JSON body with `response` (the candidate's answer) and
 *        `interviewPlan` (the plan object used for analysis). It runs the
 *        orchestrator to analyze the answer and generate a follow‑up.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method === "GET") {
    // Static interview questions. In a real implementation these could be
    // generated dynamically based on a job description.
    const questions = [
      "Tell me about yourself.",
      "What are your greatest strengths?",
      "What are your greatest weaknesses?",
      "Why do you want to work at our company?",
      "Describe a challenging project you worked on."
    ];
    res.status(200).json({ questions });
    return;
  }

  if (req.method === "POST") {
    const { response, interviewPlan } = req.body as {
      response?: string;
      interviewPlan?: any;
    };

    if (!response || !interviewPlan) {
      res
        .status(400)
        .json({ error: "Missing `response` or `interviewPlan` in request body" });
      return;
    }

    try {
      const analysis = await analyzeInterviewResponse(response, interviewPlan);
      const followUp = await generateFollowUp(analysis);
      res.status(200).json({ analysis, followUp });
    } catch (error) {
      console.error("Interview processing error:", error);
      res.status(500).json({ error: "Failed to process interview answer" });
    }
    return;
  }

  // Method not allowed
  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
