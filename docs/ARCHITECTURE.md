# Architecture Overview

```mermaid
flowchart TD
    Recruiter --> UI["EVIDENT UI (Next.js)"]
    UI --> API["API Routes (Next.js Server)"]
    API --> Orchestrator["Agent Orchestrator"]
    Orchestrator --> Tools{{"Tool Registry"}}
    Tools --> Extractor["extract_job_requirements / extract_candidate_profile"]
    Tools --> Mapper["map_candidate_evidence"]
    Tools --> GapDetector["identify_validation_gaps"]
    Tools --> InterviewPlanner["generate_interview_plan"]
    Tools --> ResponseAnalyzer["analyze_interview_response"]
    Tools --> FollowUpGen["generate_follow_up"]
    Tools --> PoolQuery["query_candidate_pool"]
    Tools --> ReportGen["generate_evaluation_report"]
    Orchestrator --> DB["Supabase PostgreSQL"]
    DB --> EvidenceStore["Structured Evidence Store"]
    DB --> Audit["audit_events"]
    UI --> Storage["Supabase Storage (PDFs)"]
    Extractor --> DB
    Mapper --> DB
    GapDetector --> DB
    InterviewPlanner --> DB
    ResponseAnalyzer --> DB
    FollowUpGen --> DB
    PoolQuery --> DB
    ReportGen --> DB
```

* **Frontend**: Next.js, TypeScript, React, Tailwind, shadcn/ui.
* **Backend**: Next.js API routes serve as thin serverless functions.
* **Database**: Supabase PostgreSQL stores workspaces, jobs, candidates, evidence graph, audit events.
* **Storage**: Supabase Storage holds uploaded PDFs and extracted text.
* **AI**: Gemini (primary) accessed via server‑side SDK; all calls enforce structured JSON schemas.
* **Agent Orchestrator**: single orchestrator agent coordinates tool calls, updates DB, logs audit events, and streams activity to UI.

The orchestrator follows the agentic loop:
`Goal -> Determine Operations -> Select Tools -> Execute -> Observe -> Identify Gaps -> Next Action`.
