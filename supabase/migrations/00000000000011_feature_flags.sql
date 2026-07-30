-- Simple workspace-scoped flags to gate beta features per tenant.
create table public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  key text not null,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, key)
);

create index idx_feature_flags_workspace_id on public.feature_flags(workspace_id);

create trigger trg_feature_flags_updated_at
  before update on public.feature_flags
  for each row execute function public.set_updated_at();

alter table public.feature_flags enable row level security;

create policy "feature_flags_select_member"
  on public.feature_flags for select
  using (public.is_workspace_member(workspace_id));

create policy "feature_flags_update_admin_plus"
  on public.feature_flags for update
  using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

-- Insert/delete intentionally left to service_role / internal tooling
-- only (no client policy) since flags are typically provisioned by
-- the platform, not end users.
