-- Reusable style presets applied to tours (colors, fonts, radius).
create table public.themes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_themes_workspace_id on public.themes(workspace_id);

create trigger trg_themes_updated_at
  before update on public.themes
  for each row execute function public.set_updated_at();

alter table public.themes enable row level security;

create policy "themes_select_member"
  on public.themes for select
  using (public.is_workspace_member(workspace_id));

create policy "themes_insert_editor_plus"
  on public.themes for insert
  with check (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "themes_update_editor_plus"
  on public.themes for update
  using (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "themes_delete_admin_plus"
  on public.themes for delete
  using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));
