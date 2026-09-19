// pages/api/settings.ts - safe connection status, never exposes secrets.
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    ai: Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.MISTRAL_API_KEY),
    db: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    storage: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
}
