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
- `track(eventName, properties?)` — fires a lifecycle/custom event. Delivery to `analytics_events`/`sessions` lands in Phase 9b; today this logs to the console.
- `start(tourId)` / `stop()` — begin or dismiss a tour by id.
- `show()` / `hide()` — re-render or clear the currently active step without changing tour progress.
- `destroy()` — tears down all SDK state (used when unmounting an SPA route, for example).

## How targeting works

Steps reference a DOM element via `target_selector` (a CSS selector), authored in the OnboardFlow tour editor using the element picker. The picker itself requires this same SDK (or its lightweight `public/picker.js` sibling used during editing) to be loaded on the page being edited — a parent page can never reach into a cross-origin iframe to pick elements, so the target page has to cooperate by loading OnboardFlow's script itself. This mirrors how Userpilot/Intercom-style pickers work in production.

## Caching & resilience

- `get-tour` responses are cached in `localStorage` for 60s and reused as a fallback if a subsequent fetch fails.
- Network requests retry up to 3 times with exponential backoff on 5xx responses or network errors.
- Step completion state is persisted per-tour in `localStorage`, so `init()` resumes at the first incomplete step on a later visit.
