-- Tenant boundary. workspace_members maps users -> workspaces.
-- Projects nest under a workspace (e.g. "Web App", "Mobile App"),
-- each with its own tours/domains/API keys.
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_workspaces_owner_id on public.workspaces(owner_id);
create index idx_workspaces_slug on public.workspaces(slug);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'editor',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index idx_workspace_members_user_id on public.workspace_members(user_id);
create index idx_workspace_members_workspace_id on public.workspace_members(workspace_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create index idx_projects_workspace_id on public.projects(workspace_id);

create trigger trg_workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- Helper functions used across all RLS policies below.
-- SECURITY DEFINER + fixed search_path to avoid RLS recursion
-- and search_path hijacking.
create or replace function public.is_workspace_member(_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = _workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(_workspace_id uuid, _roles public.workspace_role[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = _workspace_id
      and wm.user_id = auth.uid()
      and wm.role = any(_roles)
  );
$$;

create or replace function public.workspace_id_for_project(_project_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select workspace_id from public.projects where id = _project_id;
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;

-- workspaces
create policy "workspaces_select_member"
  on public.workspaces for select
  using (public.is_workspace_member(id));

create policy "workspaces_insert_authenticated"
  on public.workspaces for insert
  with check (auth.uid() = owner_id);

create policy "workspaces_update_admin"
  on public.workspaces for update
  using (public.has_workspace_role(id, array['owner','admin']::public.workspace_role[]))
  with check (public.has_workspace_role(id, array['owner','admin']::public.workspace_role[]));

create policy "workspaces_delete_owner"
  on public.workspaces for delete
  using (auth.uid() = owner_id);

-- workspace_members
create policy "workspace_members_select_member"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));

create policy "workspace_members_insert_admin"
  on public.workspace_members for insert
  with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

create policy "workspace_members_update_admin"
  on public.workspace_members for update
  using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

create policy "workspace_members_delete_admin_or_self"
  on public.workspace_members for delete
  using (
    public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])
    or user_id = auth.uid()
  );

-- projects
create policy "projects_select_member"
  on public.projects for select
  using (public.is_workspace_member(workspace_id));

create policy "projects_insert_editor_plus"
  on public.projects for insert
  with check (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "projects_update_editor_plus"
  on public.projects for update
  using (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "projects_delete_admin_plus"
  on public.projects for delete
  using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));
