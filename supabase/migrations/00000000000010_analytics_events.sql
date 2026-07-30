-- Append-only event log. Same write model as sessions (Edge Function
-- + service role only).
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tour_id uuid not null references public.tours(id) on delete cascade,
  tour_version_id uuid not null references public.tour_versions(id) on delete cascade,
  step_id uuid references public.steps(id) on delete set null,
  session_id uuid not null references public.sessions(id) on delete cascade,
  event_type public.analytics_event_type not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index idx_analytics_events_project_id on public.analytics_events(project_id);
create index idx_analytics_events_tour_id on public.analytics_events(tour_id);
create index idx_analytics_events_session_id on public.analytics_events(session_id);
create index idx_analytics_events_occurred_at on public.analytics_events(occurred_at);
create index idx_analytics_events_type on public.analytics_events(event_type);

alter table public.analytics_events enable row level security;

create policy "analytics_events_select_member"
  on public.analytics_events for select
  using (public.is_workspace_member(public.workspace_id_for_project(project_id)));

-- Writes exclusively via Edge Function + service_role (no client-side insert policy).
