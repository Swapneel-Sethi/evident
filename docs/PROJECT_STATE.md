# Project State

## Project
EVIDENT — evidence-grounded recruitment intelligence.

## Current Status
- FROZEN pre-demo: all freeze items PASS (see final report). No new features/refactors/design changes from here.

## Known Bugs
- Free-tier AI 5 req/min shared quota: rapid clicking 429s with friendly message (expected).

## What Works
- Sample-via-real-AI (7 reqs, 3 cands persisted), interview loop with persisted status transitions, NL queries, audit trail, reports, settings, 3-provider failover.

## What Works
- Uploads (JD + multi-resume, unpdf extraction), persisted gemini/keyword analysis, canonical `/api/state`, matrix + evidence drawer, dossier tabs, interview loop with follow-ups + status updates, Ask EVIDENT, audit trail, reports, settings, sample-via-real-pipeline, 3-provider failover, Vercel prod.

## What Is Being Built
- Final E2E verification, submission package.

## Known Bugs
- Free-tier AI 5 req/min shared quota: rapid clicking 429s with friendly message (expected).

## Current Blocker
- None.

## Environment Variables
- Supabase URL/anon + GEMINI/GROQ/MISTRAL keys in .env.local and Vercel prod.

## Deployment Status
- DEPLOYED https://evident-olive.vercel.app — re-verifying after UI rebuild.

## Latest Working Commit
- 33e3718 pre-rebuild baseline; rebuild commits follow.

## Next 5 Actions
1. Deploy rebuilt UI.
2. Prod E2E (sample + fresh workspace).
3. Fix fallout.
4. LinkedIn drafts (done) + screenshots.
5. Submit.
