-- Immutable-ish snapshots for draft/publish/rollback workflow.
-- Steps belong to a tour_version, not directly to a tour.
create table public.tour_versions (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  version_number integer not null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (tour_id, version_number)
);

create index idx_tour_versions_tour_id on public.tour_versions(tour_id);

alter table public.tours
  add constraint fk_tours_published_version
  foreign key (published_version_id) references public.tour_versions(id) on delete set null;

alter table public.tour_versions enable row level security;

create policy "tour_versions_select_member"
  on public.tour_versions for select
  using (public.is_workspace_member(public.workspace_id_for_tour(tour_id)));

create policy "tour_versions_insert_editor_plus"
  on public.tour_versions for insert
  with check (public.has_workspace_role(public.workspace_id_for_tour(tour_id), array['owner','admin','editor']::public.workspace_role[]));

create policy "tour_versions_update_editor_plus"
  on public.tour_versions for update
  using (public.has_workspace_role(public.workspace_id_for_tour(tour_id), array['owner','admin','editor']::public.workspace_role[]))
  with check (public.has_workspace_role(public.workspace_id_for_tour(tour_id), array['owner','admin','editor']::public.workspace_role[]));

create policy "tour_versions_delete_admin_plus"
  on public.tour_versions for delete
  using (public.has_workspace_role(public.workspace_id_for_tour(tour_id), array['owner','admin']::public.workspace_role[]));
