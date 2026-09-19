# Deployment

- Host: Vercel production — https://evident-olive.vercel.app
- Deploy: `vercel --prod` from repo root (existing linked project; preserves config).
- Production envs (Vercel dashboard, Sensitive): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`.
- Database: Supabase project `jkdomhsoyskhzuqqwrgz`; apply `supabase/schema.sql` then `supabase/migrate-evidence.sql`; buckets `job_descriptions`, `candidate_resumes` + storage `anon_rw` policy.
- Verify after each deploy: `/` 200, `/api/demo` removed (use Load Sample), `/api/settings` all true, fresh workspace → upload → analyze → interview → query → audit.
