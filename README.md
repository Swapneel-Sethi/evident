# EVIDENT

**Evidence-grounded recruitment intelligence.**

EVIDENT does not decide who should be hired. It organizes, validates, traces and updates the evidence human hiring teams need to make their own decisions.

## Problem

Recruiters juggle job descriptions, resumes, interview notes and evaluation write-ups as disconnected documents. Connecting them — for every candidate, against every requirement — is manual, inconsistent, and slow.

## Our insight

Recruiting has an **evidence problem**, not a reading problem. The fix is a persistent, auditable evidence layer:

```
JOB REQUIREMENT → CANDIDATE CLAIM → SOURCE EVIDENCE → UNCERTAINTY
→ INTERVIEW QUESTION → RESPONSE → FOLLOW-UP → UPDATED EVIDENCE → HUMAN REVIEW
```

## Solution

EVIDENT builds a **candidate evidence graph** per workspace: requirements extracted from the JD, claims extracted from resumes, each link carrying status, source document, snippet, interpretation and the interview question that would resolve it. Interview answers update the graph. Everything is audit-trailed. No scores, no rankings, no hire/reject — ever.

## What makes it different

Most resume AI outputs `Candidate score: 87%`. EVIDENT asks *what can you actually prove?*, *what is missing?*, *what should we ask?*, *what did the interview establish?*

## Core workflow

1. Create workspace, upload JD + resumes (PDF/TXT).
2. **Analyze Evidence** — requirements, profiles, evidence map, gaps, interview questions.
3. **Evidence Map** — matrix of candidates × requirements; click any cell for the source drawer.
4. **Dossier** — per-candidate evidence, gaps, interview plan, report.
5. **Interview Validation** — record answer → real AI analysis → contextual follow-up → evidence status updates.
6. **Ask EVIDENT** — natural-language evidence queries with source references.
7. **Audit Trail** — every action persisted with timestamps.

## Agentic architecture

One orchestrator (`lib/orchestrator.ts`) with typed tools: requirement extraction, profile extraction, evidence mapping, gap detection, interview planning, response analysis, follow-up generation, pool query, report data. Deterministic software handles storage, persistence, audit, validation and UI. See `docs/ARCHITECTURE.md`.

## Features

- JD + multi-resume upload with server-side PDF text extraction (per-page sources)
- Structured requirement extraction, evidence mapping with 6 canonical states
- Validation-gap detection, candidate-specific interview questions
- Response analysis with dynamic follow-ups, evidence status transitions
- NL candidate-pool queries, standardized evidence reports
- Full audit trail, 3-provider AI failover (Gemini → Groq → Mistral)
- Sample workspace generated **through the real pipeline**

## Evidence grounding

Every insight carries document, section and snippet. Nothing is inferred without a source: no invented employers, metrics, years or seniority. Unknowns are labelled `NEEDS VALIDATION` / `NO EVIDENCE FOUND`.

## Human-in-the-loop

Humans define requirements, conduct interviews, interpret evidence and make employment decisions. EVIDENT recommends questions and surfaces gaps only. Protected traits are never used.

## Tech stack

Next.js 14 + React + TypeScript, Supabase (PostgreSQL + Storage), Gemini 2.5 Flash primary with Groq + Mistral failover, Zod-validated structured outputs, `unpdf` extraction, Vercel hosting.

## Setup

```bash
npm install
cp .env.example .env.local  # fill values
npm run dev
```

## Environment variables

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | DB + storage |
| `GEMINI_API_KEY` | Primary AI (server-only) |
| `GROQ_API_KEY` / `MISTRAL_API_KEY` | Failover providers (server-only) |
| `GROQ_MODEL` / `MISTRAL_MODEL` / `AI_PROVIDER_ORDER` | Optional overrides |

Apply `supabase/schema.sql` + `supabase/migrate-evidence.sql` in the Supabase SQL editor; create `job_descriptions` + `candidate_resumes` buckets.

## Run locally / Deploy

`npm run build` must pass. Deploy with `vercel --prod`; set the env vars above as Production secrets in Vercel.

## Security

Keys server-side only (`/api/settings` reports booleans, never values). Uploads type/size-checked. Documents treated as untrusted data (prompt-injection isolation). See `docs/SECURITY.md`.

## AI development disclosure

Built with AI coding assistance (implementation, debugging, docs) under human direction: product concept, architecture decisions, testing, deployment and submission by the team. See `docs/AI_DISCLOSURE.md`.

## Demo

Live: https://evident-olive.vercel.app — **Load Sample Workspace** runs synthetic docs through the real pipeline. 3-minute script: `docs/DEMO_SCRIPT.md`.

## Future roadmap

Auth + teams, PDF report export, real-time interview mode, voice transcription, ATS integrations.
