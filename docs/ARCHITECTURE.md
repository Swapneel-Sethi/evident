# Architecture

## System

```mermaid
flowchart TD
  R[Recruiter] --> UI[EVIDENT UI - Next.js pages]
  UI --> API[Application API - /api/*]
  API --> ORCH[Agent Orchestrator - lib/orchestrator.ts]
  ORCH --> AI1[Gemini 2.5 Flash]
  ORCH --> AI2[Groq - failover]
  ORCH --> AI3[Mistral - failover]
  API --> STORE[(Structured Evidence Store)]
  STORE --> PG[(PostgreSQL / Supabase)]
  API --> ST[Supabase Storage - PDFs]
```

## Tool flow

```mermaid
flowchart LR
  JD[Job description] --> REQ[extract_job_requirements]
  RES[Resumes] --> PROF[extract_candidate_profile]
  REQ --> MAP[map_candidate_evidence]
  PROF --> MAP
  MAP --> GAP[identify_validation_gaps]
  GAP --> PLAN[generate_interview_plan]
  PLAN --> Q[Interview question]
  Q --> A[Candidate answer]
  A --> AN[analyze_interview_response]
  AN --> F[generate_follow_up]
  AN --> UPD[update_evidence_map]
  UPD --> REP[generate_evaluation_report]
```

## Evidence lifecycle

```mermaid
flowchart TD
  JR[JOB REQUIREMENT] --> RE[RESUME EVIDENCE]
  RE --> VG[VALIDATION GAP]
  VG --> IQ[INTERVIEW QUESTION]
  IQ --> IR[INTERVIEW RESPONSE]
  IR --> UE[UPDATED EVIDENCE]
  UE --> EV[FINAL EVALUATION]
```

## Canonical state

One writer (`lib/pipeline.ts` → `persistAnalysis`), one reader (`/api/state`):
`job_requirements`, `evidence_states`, `interview_responses`, `audit_events`.
Overview, Matrix, Dossier, Interview, Report, Ask and Audit all derive from `/api/state`.

## AI vs deterministic split

AI: requirement interpretation, resume understanding, semantic linking, ambiguity
detection, interview planning, answer interpretation, follow-ups, NL queries.
Deterministic: storage, persistence, audit, validation, permissions, UI state,
source navigation, failover routing.
