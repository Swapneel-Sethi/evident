# Data model

- `workspaces(id, title, created_at)` — FK root.
- `job_documents(id, workspace_id, title, content{text, source})`
- `candidate_documents(id, workspace_id, file_name, content{text, source})`
- `job_requirements(id, workspace_id, req_key UNIQUE per workspace, name, category, importance, description)`
- `evidence_states(id, workspace_id, candidate_doc_id, req_key, requirement, status, claim, source, observation, question, updated_at; UNIQUE workspace+candidate+req)` — canonical evidence.
- `interview_responses(id, workspace_id, candidate_doc_id, req_key, question, answer, analysis jsonb, follow_up)`
- `audit_events(id, workspace_id, event_type, payload jsonb, created_at)` — append-only trail.
- Storage: `job_descriptions`, `candidate_resumes` buckets; paths stored in doc content.source.
