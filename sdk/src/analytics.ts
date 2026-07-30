import { readCache, writeCache } from "./storage";

const DEFAULT_API_BASE = "https://udsmmrdkevrwiicphhbp.supabase.co/functions/v1";
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 400;

export type AnalyticsEventType =
  | "tour_started"
  | "tour_completed"
  | "tour_dismissed"
  | "step_viewed"
  | "step_completed"
  | "step_skipped"
  | "cta_clicked";

export interface RecordEventParams {
  publicKey: string;
  endUserId: string;
  eventType: AnalyticsEventType;
  tourId: string;
  tourVersionId: string;
  stepId?: string | null;
  metadata?: Record<string, unknown>;
  apiBase?: string;
}

function sessionCacheKey(publicKey: string): string {
  return `session-id:${publicKey}`;
}

function getCachedSessionId(publicKey: string): string | null {
  return readCache<string>(sessionCacheKey(publicKey));
}

function setCachedSessionId(publicKey: string, sessionId: string): void {
  writeCache(sessionCacheKey(publicKey), sessionId);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postEvent(url: string, body: unknown, attempt = 0): Promise<Response> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
    if (!response.ok && response.status >= 500 && attempt < MAX_RETRIES) {
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
      return postEvent(url, body, attempt + 1);
    }
    return response;
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
      return postEvent(url, body, attempt + 1);
    }
    throw error;
  }
}

async function sendEvent(params: RecordEventParams): Promise<void> {
  const apiBase = params.apiBase ?? DEFAULT_API_BASE;
  const sessionId = getCachedSessionId(params.publicKey) ?? undefined;

  try {
    const response = await postEvent(`${apiBase}/record-event`, {
      publicKey: params.publicKey,
      endUserId: params.endUserId,
      sessionId,
      eventType: params.eventType,
      tourId: params.tourId,
      tourVersionId: params.tourVersionId,
      stepId: params.stepId ?? null,
      metadata: params.metadata ?? {},
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });

    if (!response.ok) {
      console.warn(`[OnboardFlow] record-event failed with status ${response.status}`);
      return;
    }

    const body = (await response.json()) as { sessionId?: string };
    if (body.sessionId) {
      setCachedSessionId(params.publicKey, body.sessionId);
    }
  } catch (error) {
    console.warn("[OnboardFlow] record-event failed:", error);
  }
}

// Events are delivered strictly one-at-a-time. The very first request in a
// visitor's session doesn't know the session id yet (the Edge Function
// creates it and returns it); if two track() calls fire back-to-back
// (e.g. start() -> tour_started then immediately step_viewed), sending them
// concurrently means both read a blank cached session id and the server
// creates two separate session rows. Chaining onto a shared promise forces
// each call to wait for the previous one's response - and therefore its
// cached session id - before sending.
let deliveryQueue: Promise<void> = Promise.resolve();

export function recordEvent(params: RecordEventParams): void {
  deliveryQueue = deliveryQueue.then(() => sendEvent(params));
}
