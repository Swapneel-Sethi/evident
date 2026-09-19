// pages/api/demo.ts - zero-config synthetic demo. No Supabase, no Gemini key needed.
import type { NextApiRequest, NextApiResponse } from "next";
import { DEMO_JD, DEMO_CANDIDATES, DEMO_FOLLOWUP_EXAMPLE } from "@/lib/demoData";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  return res.status(200).json({
    synthetic: true,
    notice: "Synthetic demo data. No real people.",
    jd: DEMO_JD,
    candidates: DEMO_CANDIDATES,
    interviewExample: DEMO_FOLLOWUP_EXAMPLE,
    poolQueryExample: {
      query: "Show candidates with FastAPI project evidence but no demonstrated AWS experience.",
      answer: "Candidate A (synthetic): FastAPI EVIDENCE FOUND, AWS NO EVIDENCE FOUND. Source: FinServe API project.",
    },
  });
}
