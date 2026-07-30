# @onboardflow/sdk

Lightweight client-side SDK for rendering OnboardFlow tours on a customer's website.

## Install

```bash
npm install @onboardflow/sdk
```

```ts
import OnboardFlow from "@onboardflow/sdk";

await OnboardFlow.init({ publicKey: "pk_..." });
OnboardFlow.identify("user_123", { email: "user@example.com" });
```

## CDN

```html
<script src="https://your-cdn/onboardflow.iife.js"></script>
<script>
  OnboardFlow.init({ publicKey: "pk_..." });
</script>
```

## API

- `init({ publicKey, apiBase?, autoStart? })` — fetches published tours for the project and, unless `autoStart: false`, starts the first tour the visitor hasn't completed.
- `identify(userId, traits?)` / `updateUser(traits)` — associates subsequent events with a known user (defaults to a persisted anonymous id otherwise).
- `track(eventName, properties?)` — fires a lifecycle event (one of the 7 `analytics_event_type` values: `tour_started`, `tour_completed`, `tour_dismissed`, `step_viewed`, `step_completed`, `step_skipped`, `cta_clicked`). When called with an active tour, it's delivered to `analytics_events`/`sessions` via the `record-event` Edge Function; other calls (arbitrary event names, or before `start()`) just log locally, since `analytics_events` rows are always scoped to a tour.
- `start(tourId)` / `stop()` — begin or dismiss a tour by id.
- `show()` / `hide()` — re-render or clear the currently active step without changing tour progress.
- `destroy()` — tears down all SDK state (used when unmounting an SPA route, for example).

## How targeting works

Steps reference a DOM element via `target_selector` (a CSS selector), authored in the OnboardFlow tour editor using the element picker. The picker itself requires this same SDK (or its lightweight `public/picker.js` sibling used during editing) to be loaded on the page being edited — a parent page can never reach into a cross-origin iframe to pick elements, so the target page has to cooperate by loading OnboardFlow's script itself. This mirrors how Userpilot/Intercom-style pickers work in production.

## Framework examples

The SDK is a plain singleton with no framework dependency — it works anywhere JS runs. See `examples/` for idiomatic integration patterns:

- [`examples/vanilla.html`](./examples/vanilla.html) — CDN `<script>` tag, no build step
- [`examples/react.tsx`](./examples/react.tsx) — provider + hook pattern
- [`examples/nextjs.tsx`](./examples/nextjs.tsx) — App Router, client-only init
- [`examples/vue.ts`](./examples/vue.ts) — plugin + composable
- [`examples/angular.ts`](./examples/angular.ts) — injectable service

## Caching & resilience

- `get-tour` responses are cached in `localStorage` for 60s and reused as a fallback if a subsequent fetch fails.
- Network requests retry up to 3 times with exponential backoff on 5xx responses or network errors.
- Step completion state is persisted per-tour in `localStorage`, so `init()` resumes at the first incomplete step on a later visit.
