# Agent design

Single orchestrator (`lib/orchestrator.ts`), 11 tools: extract_job_requirements, extract_candidate_profile, analyze_candidate_once (quota-friendly combined call), map_candidate_evidence, identify_validation_gaps, generate_interview_plan, analyze_interview_response, generate_follow_up, update_evidence_map (via `evidence_states`), query_candidate_pool, generate_evaluation_report, record_audit_event.

Loop: perceive `/api/state` → select tool → validate output (Zod/`normalizeMapping`) → persist via `lib/pipeline.ts` → audit → return. Follow-ups depend on (question + answer + prior state), never predetermined. Failover across Gemini/Groq/Mistral inside `fetchGemini` keeps the loop alive when a provider 429s.
