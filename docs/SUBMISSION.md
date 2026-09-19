# Submission — EVIDENT (short + full)

## Short (elevator)

EVIDENT — evidence-grounded recruitment intelligence. Instead of scoring candidates, it maps every job requirement to resume evidence, exposes what is missing, generates validation questions, analyzes interview answers, and produces auditable human-review reports. Humans decide; EVIDENT traces.

## Full

**Product:** EVIDENT — https://evident-olive.vercel.app
**Problem (HireFlow PS3):** requirements, resumes, interview notes live disconnected; recruiters reconstruct links manually.
**Insight:** recruiting has an evidence problem. Persistent evidence layer > resume scores.
**How it works:** workspace → upload JD + resumes → Analyze → evidence matrix → dossier → interview validation (answer → AI analysis → follow-up → status update) → NL pool query → report → audit trail.
**Why agentic:** one orchestrator with 11 typed tools; it perceives workspace state, selects operations (extract/map/gap/question/analyze/follow-up), persists structured state, and adapts follow-ups to actual answers — not prompt→paragraph.
**Features:** PDF ingestion with page sources, 6-state evidence model, gap detection, personalized interview plans, dynamic follow-ups, evidence updates, NL queries, reports, audit trail, 3-provider AI failover, sample-via-real-pipeline.
**Tech:** Next.js 14, TypeScript, Supabase Postgres + Storage, Gemini 2.5 Flash → Groq → Mistral, Zod schemas, Vercel.
**Innovation:** the evidence-validation loop (resume → uncertainty → question → response → follow-up → updated evidence). Nobody else closes the loop.
**Human-in-loop:** no scores/rankings/hire-reject anywhere; protected traits ignored; unknowns labelled.
**Traceability:** every insight links document + section + snippet; full audit timeline.
**Limitations:** free-tier AI quotas (5/min) pace rapid clicking; scanned-image PDFs need text export; single-workspace focus.
**Roadmap:** auth/teams, PDF export, real-time interview mode, voice transcription, ATS integrations.
