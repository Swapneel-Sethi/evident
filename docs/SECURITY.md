# Security

- Keys (`GEMINI/GROQ/MISTRAL`, Supabase anon) live in server env only. Client bundle contains only `NEXT_PUBLIC_` URL + anon key by design; `/api/settings` returns booleans, never values. Service-role key is never in the repo or client.
- Uploads: PDF/TXT only, 10 MiB cap, parsed server-side with `unpdf`; content never executed.
- Documents treated as UNTRUSTED DATA: system prompts isolate instructions from resume/JD text; injection lines become inert claims at most.
- DB: RLS enabled with least-scope anon policies for demo tables; audit logs append-only from API routes.
- Errors: user-facing messages explain what failed + next step; no stack traces, secrets or connection strings leak (verified in prod logs review).
- Fairness: no protected-trait inputs; prompts forbid their use; no ranking/scoring surfaces exist.
- Secrets hygiene: `.env.local` git-ignored; `.env.example` tracked; chat-shared keys rotated.
