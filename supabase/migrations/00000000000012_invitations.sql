-- Pending invites to join a workspace by email.
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role public.workspace_role not null default 'editor',
  status public.invitation_status not null default 'pending',
  invited_by uuid not null references public.profiles(id) on delete restrict,
  token text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  unique (workspace_id, email, status)
);

create index idx_invitations_workspace_id on public.invitations(workspace_id);
create index idx_invitations_email on public.invitations(email);
create index idx_invitations_token on public.invitations(token);

alter table public.invitations enable row level security;

create policy "invitations_select_admin_plus"
  on public.invitations for select
  using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

create policy "invitations_insert_admin_plus"
  on public.invitations for insert
  with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

create policy "invitations_update_admin_plus"
  on public.invitations for update
  using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

create policy "invitations_delete_admin_plus"
  on public.invitations for delete
  using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

-- Note: the invitee accepting an invite (before they're a member) is
-- handled via a SECURITY DEFINER Edge Function that validates the
-- token and inserts into workspace_members -- not direct RLS, since
-- the invitee has no membership row yet to satisfy is_workspace_member().
