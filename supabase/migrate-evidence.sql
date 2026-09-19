-- EVIDENT evidence-layer migration: canonical persisted state.
-- Run in Supabase SQL editor or via Management API database/query.

create table if not exists job_requirements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  req_key text not null,
  name text not null,
  category text default 'general',
  importance text default 'required',
  description text default '',
  source_snippet text default '',
  created_at timestamptz default now(),
  unique(workspace_id, req_key)
);

create table if not exists evidence_states (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  candidate_doc_id uuid references candidate_documents(id) on delete cascade,
  req_key text not null,
  requirement text not null,
  status text not null,
  claim text default '',
  source text default '',
  observation text default '',
  question text default '',
  updated_at timestamptz default now(),
  unique(workspace_id, candidate_doc_id, req_key)
);

create table if not exists interview_responses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  candidate_doc_id uuid references candidate_documents(id) on delete cascade,
  req_key text default '',
  question text not null,
  answer text not null,
  analysis jsonb,
  follow_up text default '',
  created_at timestamptz default now()
);

alter table job_requirements enable row level security;
alter table evidence_states enable row level security;
alter table interview_responses enable row level security;

drop policy if exists anon_all on job_requirements;
drop policy if exists anon_all on evidence_states;
drop policy if exists anon_all on interview_responses;
create policy anon_all on job_requirements for all to anon using (true) with check (true);
create policy anon_all on evidence_states for all to anon using (true) with check (true);
create policy anon_all on interview_responses for all to anon using (true) with check (true);

grant select, insert, update, delete on job_requirements to anon;
grant select, insert, update, delete on evidence_states to anon;
grant select, insert, update, delete on interview_responses to anon;

-- Source traceability split (no invented sections).
alter table evidence_states add column if not exists source_doc text default '';
alter table evidence_states add column if not exists source_section text default '';
update evidence_states es set source_doc = cd.file_name from candidate_documents cd where cd.id = es.candidate_doc_id and (es.source_doc = '' or es.source_doc is null);
update evidence_states set source_section = source where source <> '' and source <> source_doc;
