-- A tour is the top-level onboarding flow entity. Its editable
-- content lives in tour_versions (draft/published snapshots).
create table public.tours (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  theme_id uuid references public.themes(id) on delete set null,
  name text not null,
  status public.tour_status not null default 'draft',
  published_version_id uuid, -- FK added in migration 7 once tour_versions exists
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tours_project_id on public.tours(project_id);
create index idx_tours_status on public.tours(status);

create trigger trg_tours_updated_at
  before update on public.tours
  for each row execute function public.set_updated_at();

create or replace function public.workspace_id_for_tour(_tour_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select p.workspace_id
  from public.tours t
  join public.projects p on p.id = t.project_id
  where t.id = _tour_id;
$$;

alter table public.tours enable row level security;

create policy "tours_select_member"
  on public.tours for select
  using (public.is_workspace_member(public.workspace_id_for_project(project_id)));

create policy "tours_insert_editor_plus"
  on public.tours for insert
  with check (public.has_workspace_role(public.workspace_id_for_project(project_id), array['owner','admin','editor']::public.workspace_role[]));

create policy "tours_update_editor_plus"
  on public.tours for update
  using (public.has_workspace_role(public.workspace_id_for_project(project_id), array['owner','admin','editor']::public.workspace_role[]))
  with check (public.has_workspace_role(public.workspace_id_for_project(project_id), array['owner','admin','editor']::public.workspace_role[]));

create policy "tours_delete_admin_plus"
  on public.tours for delete
  using (public.has_workspace_role(public.workspace_id_for_project(project_id), array['owner','admin']::public.workspace_role[]));
