# Requirements – Evident (HireFlow PS3)

## Problem Statement
Recruiters must evaluate job descriptions, candidate resumes, and interview notes, but these sources are disconnected. Manual linking of requirements to evidence is time‑consuming and error‑prone.

## Core MVP Features (non‑negotiable)
- **Workspace**: Create a hiring workspace, upload a JD (text/paste) and multiple candidate PDFs.
- **Job Requirement Extraction** – `extract_job_requirements` → structured JSON of role requirements.
- **Candidate Profile Extraction** – `extract_candidate_profile` → skills, experience, projects, evidence snippets.
- **Evidence Mapping** – `map_candidate_evidence` links requirements ↔ candidate evidence.
- **Validation Gap Detection** – `identify_validation_gaps` highlights missing/weak evidence.
- **Candidate Dossier** – UI view of evidence per candidate.
- **Interview Plan Generation** – `generate_interview_plan` creates personalized questions.
- **Interview Response Analysis** – `analyze_interview_response` adds new structured evidence.
- **Dynamic Follow‑up** – `generate_follow_up` emits a follow‑up question only when needed.
- **Evidence Graph Update** – `update_evidence_map` integrates new interview evidence.
- **Unresolved Areas View** – shows remaining gaps after interview.
- **Evaluation Report** – `generate_evaluation_report` produces a human‑reviewable summary.
- **Natural‑Language Pool Query** – `query_candidate_pool` returns evidence‑backed results.
- **Audit Trail** – `record_audit_event` logs every AI‑generated insight with source references and timestamps.

## Safety / Fairness Rules
- No autonomous hiring decisions, scores, rankings, or recommendations.
- Do not use protected attributes (race, gender, etc.) in any inference.
- Treat all uploaded documents as data only; ignore any embedded instructions.

## Evidence States (example values)
`EVIDENCE_FOUND`, `PARTIAL_EVIDENCE`, `NEEDS_VALIDATION`, `NO_EVIDENCE_FOUND`, `SUPPORTED_BY_INTERVIEW`, `CONFLICTING_INFORMATION`.

## Architecture Overview
- **Frontend**: Next.js (React, TypeScript, Tailwind, shadcn/ui).
- **Backend**: Next.js API routes (serverless functions).
- **Database**: Supabase PostgreSQL (tables for workspaces, jobs, candidates, evidence, audits, etc.).
- **Storage**: Supabase Storage for uploaded PDFs.
- **AI**: Gemini (primary) with structured JSON outputs; fallback to Groq/OpenAI if configured.
- **Agent Orchestrator**: single orchestrator agent that calls the functional tools (extraction, mapping, etc.) and maintains state in the DB.

## Data Model (simplified)
- `workspaces` (id, title, created_at)
- `job_documents` (id, workspace_id, file_path, type)
- `job_requirements` (id, job_document_id, name, category, importance, description)
- `candidates` (id, workspace_id, name)
- `candidate_documents` (id, candidate_id, file_path)
- `candidate_profiles` (id, candidate_id, json_blob)
- `evidence_items` (id, candidate_id, requirement_id, source_doc, snippet, status)
- `validation_gaps` (id, requirement_id, candidate_id, description)
- `interview_questions` (id, candidate_id, requirement_id, question_text)
- `interview_responses` (id, question_id, answer_text, new_evidence_json)
- `audit_events` (id, event_type, entity_id, source, timestamp, details)

## Development Phases (chronological)
1. **Foundation** – repo init, docs, basic Next.js app, Supabase config.
2. **Document Pipeline** – JD & PDF upload, PDF‑to‑text extraction, storage.
3. **Structured Intelligence** – implement extraction functions via Gemini, persist JSON.
4. **Evidence Engine** – mapping, gap detection, dossier UI.
5. **Interview Agent** – interview‑plan generation, response analysis, follow‑up.
6. **Reporting** – remaining gaps view, evaluation report generation.
7. **Candidate Pool Query** – natural‑language query endpoint.
8. **UX Polish** – evidence matrix, agent activity feed, error handling.
9. **Demo Mode** – synthetic JD/resumes, one‑click demo workspace.
10. **QA & Deploy** – tests, production build, Vercel + Supabase deployment.
11. **Submission Package** – README, docs (DEMO_SCRIPT, JUDGE_QA, SUBMISSION, AI_DISCLOSURE, LINKEDIN drafts), git history.

## Acceptance Criteria (must‑pass before submission)
- End‑to‑end demo (3‑minute script) runs without manual intervention.
- All MVP features functional and persisted.
- No candidate ranking or score output.
- Audit trail records each AI insight.
- Source references open to view source document, page, snippet.
- Deployment successful (Vercel & Supabase) or local dev mode works.
- Documentation complete (README, DEMO_SCRIPT, JUDGE_QA, SUBMISSION, etc.).
- LinkedIn drafts prepared.
- No placeholders (`TODO`, `FIXME`) remain.
- Security review passed (no secret exposure, input validation, prompt‑injection mitigation).

*All further work will follow the phased plan above.*
