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
| 1 | Project setup (Vite/TS/Tailwind/shadcn/router scaffold) | 🟡 In progress | Core config + provider/layout scaffolding underway |
| 2 | Supabase foundation (schema, RLS, auth) | ⬜ Not started | 14-migration schema designed, not yet written/applied |
| 3 | Authentication (email, Google, GitHub, protected routes, password reset) | ⬜ Not started | |
| 4 | Database (beyond Phase 2 base schema, if needed) | ⬜ Not started | |
| 5 | Dashboard | ⬜ Not started | |
| 6 | Projects (CRUD, search, pagination, duplicate) | ⬜ Not started | |
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

## Phase 2 — Supabase foundation (next)

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
