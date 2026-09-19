# Judge Q&A

**Why agentic, not a chatbot?** One orchestrator perceives workspace state, picks tools (extract/map/gap/question/analyze/follow-up), persists structured evidence, and adapts follow-ups to actual answers. State evolves; chat doesn't.

**Why not ChatGPT?** ChatGPT can't maintain a persistent, source-linked evidence graph across JD/resumes/interviews with audit trail, nor enforce no-ranking guardrails.

**How are claims grounded?** Every evidence row stores source document + snippet; UI drawer shows quote + interpretation. No source → "NO EVIDENCE FOUND".

**Traceability?** `/api/state` joins docs → evidence → interviews; audit table logs each operation with timestamp + payload.

**Hallucinations?** Typed schemas, quote-or-omit rules, anti-inference prompts, NEEDS VALIDATION labels.

**Missing info?** Labelled, counted as gaps, converted into interview questions.

**Why no scores?** Scores automate employment outcomes and encode bias. We show evidence coverage ("5/8 requirements supported") — descriptive, not decisive.

**Bias prevention?** No protected-trait inputs, prompts instruct ignoring them, no ranking surfaces exist to be biased.

**Dynamic questioning?** Follow-up generated from (question + answer + prior evidence), persisted with analysis; different answers → different follow-ups.

**Evidence updates?** `evidence_states` row transitions NEEDS VALIDATION → PARTIAL/SUPPORTED BY INTERVIEW with audit event.

**Data storage?** Supabase Postgres (docs, requirements, evidence, interviews, audit) + Storage buckets for PDFs. RLS anon policies; keys server-side.

**Prompt injection?** Documents treated as untrusted data; system/developer instructions isolated; injection text becomes a claim at most.

**Model?** Gemini 2.5 Flash primary (structured JSON), Groq `gpt-oss-120b` + Mistral Small failover. Chosen for JSON reliability, latency, free-tier availability.

**Built during hackathon?** Everything: pipeline, persistence, UI system, deploy, docs. See git log.

**AI dev tools?** AI-assisted coding/debugging/docs under human direction (concept, architecture, testing, deploy, submission human-owned).

**Next?** Auth/teams, PDF export, realtime interview, voice, ATS.

**Scale?** Stateless API + Postgres scales horizontally; per-workspace data model; batch + cache extractions; queue long analyses.
