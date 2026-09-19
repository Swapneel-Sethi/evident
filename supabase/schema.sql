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

-- Row-level security: permissive anon policies for hackathon demo.
-- All access goes through server-side API routes with the anon key.
alter table workspaces enable row level security;
alter table job_documents enable row level security;
alter table candidate_documents enable row level security;
alter table audit_events enable row level security;

create policy anon_all on workspaces for all to anon using (true) with check (true);
create policy anon_all on job_documents for all to anon using (true) with check (true);
create policy anon_all on candidate_documents for all to anon using (true) with check (true);
create policy anon_all on audit_events for all to anon using (true) with check (true);

grant select, insert, update, delete on workspaces to anon;
grant select, insert, update, delete on job_documents to anon;
grant select, insert, update, delete on candidate_documents to anon;
grant select, insert, update, delete on audit_events to anon;

-- Storage object policies for app buckets (anon via server-side API routes).
create policy anon_rw on storage.objects for all to anon
  using (bucket_id in ('job_descriptions','candidate_resumes'))
  with check (bucket_id in ('job_descriptions','candidate_resumes'));
