-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- Generic updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Enums
create type public.workspace_role as enum ('owner', 'admin', 'editor', 'viewer');

create type public.tour_status as enum ('draft', 'published', 'archived');

create type public.step_type as enum (
  'tooltip', 'modal', 'hotspot', 'beacon', 'checklist',
  'announcement', 'banner', 'floating_card', 'confirmation'
);

create type public.analytics_event_type as enum (
  'tour_started', 'tour_completed', 'tour_dismissed',
  'step_viewed', 'step_completed', 'step_skipped',
  'cta_clicked'
);

create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');
