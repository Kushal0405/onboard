-- Tracks the target site a project is installed on and whether the
-- OnboardFlow snippet has been verified there. Verification happens
-- client-side (loading the URL in an iframe and checking for the
-- picker.js "picker-ready" postMessage) during project creation.
alter table public.projects
  add column site_url text,
  add column is_installed boolean not null default false;
