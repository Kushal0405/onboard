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

This is a **pnpm workspace** (`pnpm-workspace.yaml`: `.` and `sdk`). The dashboard app (`src/`, this doc's main subject) and the distributable tracking SDK (`sdk/`, its own `package.json`/tsconfig/Vite config, built independently — see `sdk/README.md`) are separate packages so the SDK never pulls in dashboard dependencies. `supabase/functions/` holds Edge Functions (Deno) — currently `get-tour`, the public (no-JWT) endpoint the SDK calls to fetch published tour content by `public_key`.

Supabase project: `https://udsmmrdkevrwiicphhbp.supabase.co` (ref: `udsmmrdkevrwiicphhbp`). Credentials live in `.env.local` only (gitignored) — see `.env.example` for required variable names. Edge Functions are deployed via `pnpm exec supabase functions deploy <name> --no-verify-jwt` (only for functions meant to be called anonymously, like `get-tour`) with `SUPABASE_ACCESS_TOKEN` set.

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
| 6 | Projects (CRUD, search, pagination, duplicate) | ✅ Done | Duplicate shipped in Phase 7 alongside tour duplication |
| 7 | Tour Builder (create/delete/duplicate, draft/published/archived, undo/redo, autosave, version history) | ✅ Done | Autosave shipped in Phase 8a |
| 8 | Visual Editor (steps, drag/reorder, properties panel, placement, element picker) | ✅ Done | 8a (list/reorder/autosave), 8b (full properties panel), 8c (element picker + undo/redo + visual polish) all shipped. Picker requires the target page to load `/picker.js` (SDK-cooperative, like Userpilot/Intercom in production) — arbitrary cross-origin pages can't be click-picked due to browser security, not a bug. |
| 9 | SDK (init/identify/track/start/stop/show/hide/destroy/updateUser, CDN + npm) | 🟡 In progress (9a+9b done) | 9a: full public API + rendering + get-tour. 9b: analytics event delivery via record-event, verified end-to-end (including a real concurrency bug found and fixed — see below). 9c (framework wrapper examples) still to come. |
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

## Phase 9b — SDK: analytics event delivery (done)

- `supabase/functions/record-event/index.ts` — public Edge Function (`verify_jwt = false`), validates `public_key`, finds-or-creates a `sessions` row (by `sessionId` if the caller has one, else creates a new one and returns its id), inserts into `analytics_events`. Same trust model as `get-tour`: service role internally, caller has no auth.
- `sdk/src/analytics.ts` — `recordEvent()` posts to `record-event` with retry/backoff on 5xx/network errors, caches the returned `session_id` in `localStorage` keyed by `public_key` so subsequent calls reuse the same session.
- **Real bug found and fixed during verification**: the SDK fires multiple `track()` calls back-to-back on tour start (`tour_started` then `step_viewed`, synchronously in `start()`/`renderActiveStep()`). Sending these concurrently meant every call read the *same empty* cached session id before any response came back, so the Edge Function created a separate session row per event instead of one per visitor. Fixed with a serialized delivery queue (`deliveryQueue = deliveryQueue.then(() => sendEvent(params))` in `analytics.ts`) — each event now waits for the previous one's response, and therefore its cached session id, before sending. Verified with a live jsdom run against a real published tour: exactly 1 session row, all events correctly attributed to it.
- `track()` in `sdk/src/index.ts` now actually delivers for the 7 spec'd `analytics_event_type` enum values when called with an active tour; calls outside that (arbitrary event names, or before `start()`) still just log locally, since `analytics_events` has no room for tour-less events by schema design.

## Phase 9a — SDK: core vanilla JS SDK (done)

Phase 9 splits into 9a (this — core SDK + data fetch path), 9b (analytics event delivery to `analytics_events`/`sessions`), 9c (npm/CDN packaging polish + React/Next/Vue/Angular framework examples).

- **Data fetch path**: the SDK runs anonymously on a customer's site with no Supabase Auth session, so it can't satisfy any RLS policy (all require workspace membership). `supabase/functions/get-tour/index.ts` is a public Edge Function (`verify_jwt = false` in `supabase/config.toml`) that validates a `public_key` against `api_keys`, then returns published tours + their latest-published-version steps for that project, using the service role internally (the Edge Function itself is the trust boundary, not the caller). Deployed via `supabase functions deploy get-tour --no-verify-jwt`. Verified live: 200 + real tour/step data for a valid key, 401 for an invalid one, called with zero auth headers.
- **`sdk/` package** (own `package.json`, builds independently of the dashboard app): `src/index.ts` exports a singleton `OnboardFlow` instance implementing the full spec'd API — `init`, `identify`, `updateUser`, `track`, `start`, `stop`, `show`, `hide`, `destroy`. `init()` resumes at the first tour/step the visitor hasn't completed (tracked in `localStorage`), matching "identify returning visitors and resume state" behavior.
- **Renderer** (`src/renderer.ts`, `src/position.ts`, `src/styles.ts`) — real DOM rendering (no framework, no shadow DOM yet) for all 9 step types: `tooltip`/`hotspot`/`floating_card` position relative to `target_selector` with a highlight box; `beacon` renders a pulsing dot that expands into a card on click; `modal`/`announcement`/`confirmation` center; `banner` is a fixed top bar; `checklist` renders its items inline in the card. Reuses the exact `StepContent` shape from `src/features/editor/types.ts` (duplicated into `sdk/src/types.ts` since the SDK can't depend on the dashboard app's source — kept in sync manually for now).
- **Caching/resilience** (`src/api.ts`): `get-tour` responses cached in `localStorage` for 60s with stale-cache fallback on fetch failure; retries up to 3 times with exponential backoff on 5xx/network errors. `src/storage.ts` also persists a per-visitor anonymous id and per-tour completed-step-ids.
- **Build**: two Vite configs — `vite.config.ts` (es + cjs, named exports, for `npm install @onboardflow/sdk`) and `vite.config.cdn.ts` (iife from a separate `cdn-entry.ts` default-export-only entry, so `window.OnboardFlow` is the SDK instance directly, not a namespace object — named+default exports together in one iife build produces `window.OnboardFlow.default`, which is wrong for a `<script src>` consumer). Gzipped iife bundle is ~4KB.
- **Verified end-to-end**: used jsdom to load the actual built `dist/onboardflow.iife.js`, called `init()` against the live `get-tour` function with a real published 2-step tour (a targeted tooltip anchored to a real button, then a centered modal), clicked through both steps via the rendered buttons, confirmed correct highlight/no-highlight per step type, confirmed the DOM fully clears on tour completion, and confirmed all three localStorage cache keys were written.
- `track()` currently only `console.debug`s — Phase 9b wires it to a `record-event` Edge Function writing into `sessions`/`analytics_events` (both tables were already designed in Phase 2 with RLS that blocks all client writes for exactly this reason — service-role-only via an Edge Function).
- **Not yet done**: analytics delivery (9b), npm publish config beyond a valid `package.json` (not actually published to a registry), framework wrapper examples beyond the vanilla JS one in `sdk/examples/vanilla.html` (9c).

## Phase 8c — Visual Editor: element picker, undo/redo, visual polish (done)

**Architectural note on the element picker** (important context for later phases, especially Phase 9's SDK): true click-to-pick across a cross-origin iframe is blocked by the browser itself — there's no script the parent page can run inside a cross-origin iframe, regardless of framing headers. This isn't a bug to work around; it's the same trust boundary `X-Frame-Options`/CSP exist to enforce. Production tools like Userpilot/Intercom solve this because their *own SDK* is what runs on the target page and cooperatively `postMessage`s back — the target page has opted in by loading their script. OnboardFlow's picker works the same way:

- `public/picker.js` — a small standalone injectable script (pulled forward from Phase 9's SDK scope) that a target page loads via `<script src=".../picker.js">`. Listens for a `start-picker` postMessage, highlights the hovered element with a fixed-position overlay box, generates a CSS selector on click (prefers `#id`, falls back to filtered stable classes — auto-generated ones like `js-*`/hashed classes are excluded — then `nth-of-type` among same-tag siblings, capped at depth 6), and posts `element-picked` back to the parent. Selector algorithm verified in isolation against id/class/sibling-index/nested-path cases.
- `hooks/useElementPicker.ts` — listens for `picker-ready` (snippet detected), `picker-started`, `element-picked`, `picker-cancelled` messages.
- `components/ElementPickerCanvas.tsx` — URL bar + iframe (sandboxed: `allow-scripts allow-same-origin allow-forms allow-popups`) + "Pick element" toggle, shown once the snippet posts `picker-ready`. If a page can't be framed at all (most production sites, since `onError` doesn't reliably fire for `X-Frame-Options` blocks), the UI degrades to manual selector entry — documented honestly in `InstallSnippetDialog.tsx`, not silently broken.
- `components/TargetSelectorField.tsx` — text input (manual entry always works) + a picker button that opens `ElementPickerCanvas` in a dialog; wired into `StepPropertiesPanel` for DOM-targeted step types, autosaves to `steps.target_selector`.
- `hooks/useStepHistory.ts` + wiring in `StepPropertiesPanel` — generic undo/redo over a `{title, stepType, content, targetSelector}` snapshot, pushes to history only on settled changes (not every keystroke, via reference-equality + JSON diff check), 50-entry cap, Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z shortcuts (ignored while focused in a text input, since those have native undo) plus toolbar buttons.
- Visual polish: `SortableStepItem` now shows a per-type icon (`utils/stepTypeIcons.tsx`) and a selected/hover state closer to Userpilot's step list; `TourEditorPage` shell tightened (step count header, card-style panes, consistent rounding/shadow).
- Verified: `picker.js` served correctly from `dist/`, selector-generation algorithm tested in isolation, `target_selector` persistence verified against live Supabase.

## Phase 8b — Visual Editor: full properties panel (done)

- `StepContent` extended with `animation` (none/fade/slide), `checklistItems`, `confirmLabel`/`cancelLabel`. `parseStepContent` updated to defensively parse all new fields with fallbacks.
- `TARGETED_STEP_TYPES` (tooltip/hotspot/beacon/floating_card) vs `CENTERED_STEP_TYPES` (modal/announcement/confirmation) in `types.ts` — the properties panel conditionally shows placement/highlight-padding/border-radius only for targeted types, since centered overlays don't anchor to a DOM element.
- `components/ButtonListEditor.tsx` — add/remove/edit label+action for the step's CTA buttons. `components/ChecklistItemsEditor.tsx` — add/remove/edit checklist item labels (only shown for `checklist` step type).
- Confirmation-specific `confirmLabel`/`cancelLabel` fields shown only for the `confirmation` step type.
- Step type can now be changed from the properties panel — this write is immediate (not debounced through autosave) since switching type changes which fields are visible and a stale debounce could save the wrong shape.
- Verified end-to-end against live Supabase: step type change, checklist items round-trip, confirmation labels, custom buttons array, animation field.
- **Not yet done**: visual redesign of the editor UI (currently functional but plain — a dedicated pass will restyle the step list/panel/add a live preview canvas, Userpilot-inspired). No slider component was added; padding/radius/opacity use plain number inputs to avoid another Radix dependency for this admin-style panel — acceptable for now, may swap to a slider in the redesign pass if it improves UX.

## Phase 8a — Visual Editor: step list, reorder, autosave (done)

Phase 8 is split into three passes: **8a** (this — step list CRUD/reorder + basic properties + autosave), **8b** (full properties panel + all 9 step types), **8c** (URL-in-iframe element picker + undo/redo). Each is built, verified, and committed separately given the total scope.

- `src/features/editor/types.ts` — `StepContent` shape (body, placement, highlightPadding, borderRadius, overlayOpacity, showProgress, buttons) designed for the full properties panel up front, even though 8a only exposes body/placement/showProgress in the UI — avoids a painful data migration when 8b adds the rest. `STEP_TYPES`/`STEP_TYPE_LABELS` cover all 9 spec'd types (tooltip, modal, hotspot, beacon, checklist, announcement, banner, floating_card, confirmation).
- `api/stepQueries.ts` — `fetchSteps`, `createStep` (seeds `DEFAULT_STEP_CONTENT`), `updateStep`, `deleteStep`, `reorderSteps`. **Reorder is two-phase** (negative staging positions, then final positions) because `steps` has a `unique (tour_version_id, position)` constraint — writing final positions directly can transiently collide depending on update order when swapping steps. Verified against live Supabase with an actual 3-step swap.
- `hooks/useSteps.ts`, `useStepMutations.ts`, `useAutosaveStep.ts` (800ms debounce, tracks `idle/saving/saved/error` status, keyed per step id).
- `utils/parseStepContent.ts` — defensively parses the untyped `Json` column into `StepContent` with per-field fallbacks (DB has no schema for JSONB contents).
- `components/SortableStepItem.tsx` (dnd-kit `useSortable`), `AddStepMenu.tsx`, `StepPropertiesPanel.tsx` (title, body, placement select, progress toggle — this is the "basic" subset; full styling controls land in 8b).
- `pages/TourEditorPage.tsx` (route `/dashboard/tours/:tourId/edit`) — two-pane layout (step list + properties), `DndContext`/`SortableContext` for reordering, optimistic local reorder with rollback on failure.
- New shared UI primitives added as needed: `src/components/ui/{textarea,select,switch}.tsx` (standard shadcn, `@radix-ui/react-select` + `@radix-ui/react-switch` installed). `@dnd-kit/{core,sortable,utilities}` installed for drag-and-drop.
- Verified end-to-end against live Supabase: create 3 steps, list in position order, reorder (swap, collision-safe), update content JSONB, delete, confirm remaining count.

## Phase 7 — Tour Builder (done)

- `src/features/tours/api/tourQueries.ts` — `fetchToursForProject`, `createTour` (also inserts the initial `tour_versions` row, version 1, unpublished), `deleteTour`, `duplicateTour` (clones the tour row + creates a fresh version 1 + clones all `steps` from the source tour's latest version), `archiveTour`, `restoreTourToDraft`, `publishTourLatestVersion` (marks the latest `tour_versions` row published, sets `tours.status = 'published'` and `tours.published_version_id`), `fetchTourVersions`.
- `hooks/useTours.ts`, `useTourMutations.ts` (create/remove/duplicate/archive/restoreToDraft/publish), `useTourVersions.ts` — TanStack Query, invalidate the `tours` list on any mutation.
- `components/TourStatusBadge.tsx` (draft/published/archived), `TourActionsMenu.tsx` (publish/archive/restore/duplicate/version-history/delete dropdown), `CreateTourDialog.tsx`, `DeleteTourDialog.tsx`, `VersionHistoryDialog.tsx`.
- `src/components/ui/badge.tsx` — added (standard shadcn badge, wasn't needed until status pills).
- `src/features/projects/pages/ProjectDetailPage.tsx` (route `/dashboard/projects/:projectId`) — lists tours for a project; `ProjectsPage` cards now link here.
- `src/features/projects/api/projectQueries.ts` gained `fetchProjectById` + `hooks/useProject.ts` for the detail page header.
- Verified end-to-end against live Supabase: create → add a step → publish → duplicate (confirmed step cloning) → archive → restore → version history → delete (confirmed cascade deletes cloned steps).
- **Deferred to Phase 8**: undo/redo and autosave apply to step-editor content, which doesn't exist until the visual editor is built — building them now against nothing would be premature. Duplicate's step-cloning logic (built here) already gives Phase 8 something real to extend.

## Phase 6 — Projects (done — includes tour duplication's step-cloning support)

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
