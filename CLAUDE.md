# OnboardFlow

No-code onboarding/product-tour SaaS (like UserGuiding/Appcues/Chameleon/Storylane), built for **zero infrastructure cost**: React+Vite frontend on Vercel, Supabase for everything backend (Auth, Postgres, Storage, Realtime, Edge Functions). No servers, no Docker, no self-hosted infra — ever, until there are paying customers.

## Tech stack

- **Frontend**: React + Vite + TypeScript (strict) + Tailwind CSS + shadcn/ui (New York style, Zinc base) + React Router + React Hook Form + Zod + TanStack Query + Zustand
- **Backend**: Supabase only — Auth, Postgres, Storage, Realtime, Edge Functions. No Express/Node server/NestJS.
- **Hosting**: Vercel (free tier)
- **Charts**: Recharts · **Icons**: Lucide React · **Animation**: Framer Motion · **Rich text**: Tiptap · **Drag & drop**: dnd-kit
- **Package manager**: pnpm

## Architecture

Feature-based structure under `src/`:
```
app/            router, providers, top-level App
components/ui/  shadcn primitives
layouts/        RootLayout, DashboardLayout, AuthLayout
features/       auth, dashboard, projects, tours, editor, analytics, settings
                (each: components/, hooks/, api/, types.ts)
hooks/          shared cross-feature hooks
lib/            supabase client, cn() util
services/       shared cross-feature services
types/          shared types + generated supabase.ts
utils/          shared pure utils
styles/         globals.css (Tailwind + shadcn CSS vars)
```

Path alias: `@/*` → `src/*`.

Supabase project: `https://udsmmrdkevrwiicphhbp.supabase.co` (ref: `udsmmrdkevrwiicphhbp`). Credentials live in `.env.local` only (gitignored) — see `.env.example` for required variable names.

## Working style

**This project is built phase-by-phase, not all at once.** Each phase is scoped, planned, implemented, and verified before the next begins — do not jump ahead to later phases' code unless explicitly asked. When starting a new session, check the Phase Status table below to see what's done and what's next.

## Phase status

| # | Phase | Status | Notes |
|---|-------|--------|-------|
| 1 | Project setup (Vite/TS/Tailwind/shadcn/router scaffold) | ✅ Done | |
| 2 | Supabase foundation (schema, RLS, auth) | ✅ Done | 14 migrations applied to live project; auth trigger verified end-to-end |
| 3 | Authentication (email, Google, GitHub, protected routes, password reset) | ✅ Done | Login/signup/forgot-password/reset-password/OAuth-callback pages, RequireAuth-gated dashboard route, logout. Google OAuth enabled in Supabase dashboard by user; GitHub OAuth still needs dashboard setup |
| 4 | Database (beyond Phase 2 base schema, if needed) | ✅ Skipped | No gaps found; Phase 2's schema covers everything so far. Revisit only if a later phase needs new tables/columns |
| 5 | Dashboard | ✅ Done | Workspace switcher, sidebar nav, empty-state home page — see below |
| 6 | Projects (CRUD, search, pagination, duplicate) | 🟡 Mostly done | Create/Delete/Search/Pagination shipped; Duplicate deferred to Phase 7 (more meaningful once tours exist to clone) |
| 7 | Tour Builder (create/delete/duplicate, draft/published/archived, undo/redo, autosave, version history) | ⬜ Not started | |
| 8 | Visual Editor (steps, drag/reorder, properties panel, placement, element picker) | ⬜ Not started | |
| 9 | SDK (init/identify/track/start/stop/show/hide/destroy/updateUser, CDN + npm) | ⬜ Not started | |
| 10 | Analytics (event tracking, dashboards, charts, filtering) | ⬜ Not started | |
| 11 | Settings (workspace, profile, password, API keys, team, domains, billing placeholder) | ⬜ Not started | |
| 12 | Optimization (lazy loading, code splitting, memoization, virtualization) | ⬜ Not started | |
| 13 | Deployment (Vercel) | ⬜ Not started | |
| 14 | Documentation | ⬜ Not started | |

## Phase 1 — Project setup (current)

Vite + React + TS scaffold, Tailwind + shadcn/ui init (New York/Zinc), ESLint flat config + Prettier, `@/*` path aliases, feature-based folder structure, React Router base + lazy routes, TanStack Query provider, Zustand convention (stores created per-feature when needed, not stubbed upfront), git init.

## Phase 3 — Authentication (done)

- Pages under `src/features/auth/pages/`: `LoginPage`, `SignupPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `AuthCallbackPage` — all routed under `<AuthLayout>` in `src/app/routes.tsx` (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`).
- Forms use React Hook Form + Zod resolvers; schemas live in `src/features/auth/schemas.ts`.
- `src/features/auth/components/OAuthButtons.tsx` — Google + GitHub buttons calling `signInWithOAuth`, redirecting through `/auth/callback`.
- `/dashboard` is gated by `RequireAuth` (`src/features/auth/components/RequireAuth.tsx`) wrapping `DashboardLayout`; unauthenticated users are redirected to `/login` with the original destination preserved in router state.
- `DashboardLayout` now shows the signed-in user's email and a sign-out button (calls `authService.signOut()`).
- **OAuth dashboard setup**: Google provider enabled by user in Supabase Dashboard → Authentication → Providers. GitHub still needs the same treatment (create a GitHub OAuth App, add Client ID/Secret in the Supabase dashboard, callback URL `https://udsmmrdkevrwiicphhbp.supabase.co/auth/v1/callback`) before the GitHub button will work — the code path is already wired and doesn't need changes once that's done.
- Password reset flow: `ForgotPasswordPage` calls `resetPasswordForEmail` (redirects to `/reset-password`); Supabase auto-establishes a recovery session from the emailed link, and `ResetPasswordPage` calls `updateUser({ password })`.

## Phase 6 — Projects (mostly done; Duplicate deferred)

- `src/features/projects/api/projectQueries.ts` — `fetchProjects` (paginated, `count: "exact"`, optional `ilike` name search, page size 12), `createProject` (slugifies the name, retries with a numeric suffix on `23505` unique-violation), `deleteProject`.
- `hooks/useProjects.ts`, `useCreateProject.ts`, `useDeleteProject.ts` — TanStack Query wrappers; create/delete invalidate both the `projects` list and the dashboard's `project-count` query key.
- `components/CreateProjectDialog.tsx`, `DeleteProjectDialog.tsx` — shadcn `Dialog`-based forms; delete requires explicit confirmation and warns that tours/analytics under the project are also removed (cascade is enforced at the DB level via `on delete cascade`).
- `pages/ProjectsPage.tsx` — debounced search (`src/hooks/useDebouncedValue.ts`, 300ms), paginated grid, empty states for "no projects" vs "no search matches".
- Verified end-to-end against live Supabase: create (incl. slug-collision retry), list, search filter, delete, and count all confirmed working under RLS with a real signed-in session.
- **Duplicate deferred to Phase 7**: cloning an empty project isn't meaningful yet; will be added once tours exist so duplicate can also clone a project's tours.

## Phase 5 — Dashboard (done)

- `src/features/dashboard/stores/activeWorkspaceStore.ts` — Zustand store (persisted to localStorage) holding the currently selected workspace id.
- `src/features/dashboard/api/workspaceQueries.ts` + `hooks/useWorkspaces.ts` — TanStack Query wrapper around `workspace_members` joined to `workspaces`, scoped by the signed-in user (RLS-enforced).
- `hooks/useActiveWorkspace.ts` — resolves the active membership (persisted choice if still valid, else first membership) and keeps the store in sync.
- `components/WorkspaceSwitcher.tsx` — dropdown in the sidebar to switch between workspaces the user belongs to.
- `components/SidebarNav.tsx` — Dashboard / Projects / Analytics / Settings nav links (`react-router-dom` `NavLink`, active-state styling).
- `DashboardLayout` now renders the workspace switcher + sidebar nav; unchanged sign-out behavior in the header.
- `pages/DashboardHomePage.tsx` — real query against `projects` (`api/projectQueries.ts`, `count` with `head: true`) scoped to the active workspace; shows a genuine empty-state card when count is 0, or a project-count card otherwise. No mock/hardcoded stats.
- `/dashboard/projects`, `/dashboard/analytics`, `/dashboard/settings` are routed to minimal "coming in Phase N" stub pages (`src/features/{projects,analytics,settings}/pages/`) — real implementations land in their respective phases.
- Phase 4 (additional DB work) was reviewed and skipped: Phase 2's schema already covers what Phase 5 needed.

## Phase 2 — Supabase foundation (done, see migrations in supabase/migrations/)

Full design already exists in `C:\Users\saisu\.claude\plans\you-are-a-senior-composed-seahorse.md` (or ask to re-derive if that file is gone) — summary:

- **Multi-tenancy**: `workspaces` → `projects` → `tours` → `tour_versions` → `steps`. `workspace_members` maps users to workspaces with a role (`owner`/`admin`/`editor`/`viewer`).
- **Tables** (12): `profiles`, `workspaces`, `workspace_members`, `projects`, `domains`, `themes`, `tours`, `tour_versions`, `steps`, `sessions`, `analytics_events`, `feature_flags`, `invitations`, `api_keys`.
- **RLS**: every table has RLS enabled. Cross-table checks route through `SECURITY DEFINER` helper functions (`is_workspace_member()`, `has_workspace_role()`, `workspace_id_for_project()`, etc.) defined once to avoid policy recursion — see migration 3 (`workspaces`).
- **Write model**: `sessions` and `analytics_events` are written only via Edge Functions using the service-role key (end-user tracking data, not directly writable by authenticated dashboard users) — only `select` RLS exists for those tables client-side.
- **Auth trigger**: `handle_new_user()` on `auth.users` insert auto-creates a `profiles` row, a default `workspaces` row, and an `owner` `workspace_members` row.
- **Migration order**: 14 files, `supabase/migrations/00000000000001_extensions_and_helpers.sql` through `..._014_auth_triggers.sql` (helpers/enums first, auth trigger last since it depends on `profiles` + `workspaces` existing).
- OAuth (Google/GitHub) is configured in the Supabase dashboard, not in code.

## Conventions to follow in every phase

- No placeholders, no TODO comments, no stub/fake implementations — every feature built must actually work end-to-end.
- Strict TypeScript everywhere; no `any`.
- Reuse existing components/hooks/patterns before creating new ones.
- RLS on every table; never trust client input; sanitize/escape user content (esp. Tiptap-rendered rich text in tour steps).
- Don't build ahead of the current phase's scope — no dashboard code during Phase 2, no analytics code during Phase 5, etc.
