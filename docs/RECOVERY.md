# Recovery

PRODUCT: EVIDENT. PROBLEM: HireFlow PS3.
IDEA: evidence graph JD→claim→source→gap→question→answer→follow-up→report; humans decide.
ARCH: Next.js API routes + orchestrator + Supabase (see ARCHITECTURE.md).
RUN: `npm run dev` (needs `.env.local`); `npm run build`; `vercel --prod`.
WORKS: uploads, persisted analysis, matrix/drawer, dossier, interview loop, ask, audit, report, sample-via-pipeline, 3-provider failover.
FILES: `lib/pipeline.ts`, `lib/orchestrator.ts`, `lib/gemini.ts`, `pages/api/*`, `components/ui.tsx`, `supabase/*.sql`.
DB: project `jkdomhsoyskhzuqqwrgz`; schema.sql + migrate-evidence.sql; buckets job_descriptions/candidate_resumes.
ENVS: Supabase URL/anon + GEMINI/GROQ/MISTRAL keys (Vercel prod + .env.local).
DEPLOYED: https://evident-olive.vercel.app. COMMIT: see git log.
BLOCKER: free-tier AI quotas (5/min) — pace clicks.
NEXT: verify prod E2E → LinkedIn → submit.
