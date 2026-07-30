-- Individual steps of a tour_version. Ordered via position.
create table public.steps (
  id uuid primary key default gen_random_uuid(),
  tour_version_id uuid not null references public.tour_versions(id) on delete cascade,
  step_type public.step_type not null,
  position integer not null,
  title text,
  content jsonb not null default '{}'::jsonb, -- Tiptap JSON + targeting/positioning config
  target_selector text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tour_version_id, position)
);

create index idx_steps_tour_version_id on public.steps(tour_version_id);

create trigger trg_steps_updated_at
  before update on public.steps
  for each row execute function public.set_updated_at();

create or replace function public.workspace_id_for_tour_version(_tour_version_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select public.workspace_id_for_tour(tv.tour_id)
  from public.tour_versions tv
  where tv.id = _tour_version_id;
$$;

alter table public.steps enable row level security;

create policy "steps_select_member"
  on public.steps for select
  using (public.is_workspace_member(public.workspace_id_for_tour_version(tour_version_id)));

create policy "steps_insert_editor_plus"
  on public.steps for insert
  with check (public.has_workspace_role(public.workspace_id_for_tour_version(tour_version_id), array['owner','admin','editor']::public.workspace_role[]));

create policy "steps_update_editor_plus"
  on public.steps for update
  using (public.has_workspace_role(public.workspace_id_for_tour_version(tour_version_id), array['owner','admin','editor']::public.workspace_role[]))
  with check (public.has_workspace_role(public.workspace_id_for_tour_version(tour_version_id), array['owner','admin','editor']::public.workspace_role[]));

create policy "steps_delete_editor_plus"
  on public.steps for delete
  using (public.has_workspace_role(public.workspace_id_for_tour_version(tour_version_id), array['owner','admin','editor']::public.workspace_role[]));
