-- End-user (not OnboardFlow user) browser sessions that a tour was
-- shown to. Written by the public tracking script via an Edge
-- Function using the service role -- NOT directly by anon clients,
-- hence the restrictive RLS below.
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  end_user_id text not null, -- external/anonymous identifier from host app
  domain_id uuid references public.domains(id) on delete set null,
  user_agent text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index idx_sessions_project_id on public.sessions(project_id);
create index idx_sessions_end_user_id on public.sessions(end_user_id);

alter table public.sessions enable row level security;

-- Dashboard users can only read sessions for workspaces they belong to.
create policy "sessions_select_member"
  on public.sessions for select
  using (public.is_workspace_member(public.workspace_id_for_project(project_id)));

-- No insert/update/delete policies for anon/authenticated roles:
-- all writes happen via an Edge Function using the service_role key,
-- which bypasses RLS entirely by design.
