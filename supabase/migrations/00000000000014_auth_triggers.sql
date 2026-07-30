-- Auto-create a profiles row (and a default workspace) whenever a
-- new auth.users row is created (email/password or OAuth signup).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.workspaces (name, slug, owner_id)
  values (
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)) || '''s Workspace',
    'ws-' || replace(new.id::text, '-', ''),
    new.id
  )
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
