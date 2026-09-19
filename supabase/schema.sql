-- EVIDENT MVP schema (Supabase Postgres)
-- Run in Supabase SQL editor or via supabase db push.

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz default now()
);

create table if not exists job_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  title text not null,
  content jsonb not null,
  created_at timestamptz default now()
);

create table if not exists candidate_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  file_name text not null,
  content jsonb not null,
  created_at timestamptz default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  event_type text not null,
  payload jsonb,
  created_at timestamptz default now()
);

-- Storage buckets (create in Supabase dashboard > Storage):
--   job_descriptions (public or private)
--   candidate_resumes (private recommended)
