-- Public "embed" keys used by the client-side tour-loader script to
-- fetch published tour config (low trust, read-only, rate-limited at
-- the Edge Function layer) -- distinct from any future secret
-- server-side key. One active public key per project by convention,
-- but the table allows multiple for rotation.
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null default 'Default',
  public_key text not null unique default ('pk_' || encode(extensions.gen_random_bytes(20), 'hex')),
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index idx_api_keys_project_id on public.api_keys(project_id);
create index idx_api_keys_public_key on public.api_keys(public_key);

alter table public.api_keys enable row level security;

create policy "api_keys_select_editor_plus"
  on public.api_keys for select
  using (public.has_workspace_role(public.workspace_id_for_project(project_id), array['owner','admin','editor']::public.workspace_role[]));

create policy "api_keys_insert_admin_plus"
  on public.api_keys for insert
  with check (public.has_workspace_role(public.workspace_id_for_project(project_id), array['owner','admin']::public.workspace_role[]));

create policy "api_keys_update_admin_plus"
  on public.api_keys for update
  using (public.has_workspace_role(public.workspace_id_for_project(project_id), array['owner','admin']::public.workspace_role[]))
  with check (public.has_workspace_role(public.workspace_id_for_project(project_id), array['owner','admin']::public.workspace_role[]));

create policy "api_keys_delete_admin_plus"
  on public.api_keys for delete
  using (public.has_workspace_role(public.workspace_id_for_project(project_id), array['owner','admin']::public.workspace_role[]));
