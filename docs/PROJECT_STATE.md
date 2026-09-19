# Project State

## Project
EVIDENT

## Current Status
- Production build passes (Next 14.2.35). UI wired to API routes.

## What Works
- Repository created, docs folder added.
- JD upload, resume upload, analyze (keyword fallback + Gemini path), interview, dossier, query, activity, report pages.
- `npm run build` green.

## What Is Being Built
- Core architecture design, initial scaffolding.
- Zero-config synthetic demo (no Supabase, no Gemini key): /api/demo + Load Demo Workspace button.

## Known Bugs
- None yet.

## Current Blocker
- Deploy needs: VERCEL_TOKEN, Supabase URL + anon key, GEMINI_API_KEY (valid AIza-format key).

## Deployment Status
- Not deployed. Schema ready at supabase/schema.sql. .env.example present.
- Supabase LIVE: project active, schema + RLS + grants applied, buckets created, .env.local written. Roundtrip verified (workspace → activity post → activity get).

## Latest Working Commit
- N/A (initial commit).

## Next 5 Actions
1. Implement backend orchestrator (API routes and service layer).
2. Build UI pages for workspace, candidate dossier, interview, report.
3. Connect UI to orchestrator endpoints.
4. Add evidence matrix component and activity feed.
5. Write initial integration tests for end-to-end flow.
