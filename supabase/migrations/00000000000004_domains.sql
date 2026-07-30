-- Verified embed domains per project (where the tour JS snippet is
-- allowed to run / where analytics events are attributed).
create table public.domains (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  hostname text not null,
  is_verified boolean not null default false,
  verification_token text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, hostname)
);

create index idx_domains_project_id on public.domains(project_id);

create trigger trg_domains_updated_at
  before update on public.domains
  for each row execute function public.set_updated_at();

alter table public.domains enable row level security;

create policy "domains_select_member"
  on public.domains for select
  using (public.is_workspace_member(public.workspace_id_for_project(project_id)));

create policy "domains_insert_editor_plus"
  on public.domains for insert
  with check (public.has_workspace_role(public.workspace_id_for_project(project_id), array['owner','admin','editor']::public.workspace_role[]));

create policy "domains_update_editor_plus"
  on public.domains for update
  using (public.has_workspace_role(public.workspace_id_for_project(project_id), array['owner','admin','editor']::public.workspace_role[]))
  with check (public.has_workspace_role(public.workspace_id_for_project(project_id), array['owner','admin','editor']::public.workspace_role[]));

create policy "domains_delete_admin_plus"
  on public.domains for delete
  using (public.has_workspace_role(public.workspace_id_for_project(project_id), array['owner','admin']::public.workspace_role[]));
