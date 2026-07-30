import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_EVENT_TYPES = new Set([
  "tour_started",
  "tour_completed",
  "tour_dismissed",
  "step_viewed",
  "step_completed",
  "step_skipped",
  "cta_clicked",
]);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

interface RecordEventBody {
  publicKey?: string;
  endUserId?: string;
  sessionId?: string;
  eventType?: string;
  tourId?: string;
  tourVersionId?: string;
  stepId?: string | null;
  metadata?: Record<string, unknown>;
  userAgent?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const body = (await req.json().catch(() => null)) as RecordEventBody | null;
  if (!body) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { publicKey, endUserId, sessionId, eventType, tourId, tourVersionId, stepId, metadata, userAgent } =
    body;

  if (!publicKey || !endUserId || !eventType || !tourId || !tourVersionId) {
    return jsonResponse(
      { error: "Missing required fields: publicKey, endUserId, eventType, tourId, tourVersionId" },
      400,
    );
  }

  if (!VALID_EVENT_TYPES.has(eventType)) {
    return jsonResponse({ error: `Invalid eventType: ${eventType}` }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: apiKey, error: apiKeyError } = await supabase
    .from("api_keys")
    .select("project_id, is_active")
    .eq("public_key", publicKey)
    .maybeSingle();

  if (apiKeyError) {
    return jsonResponse({ error: "Lookup failed" }, 500);
  }
  if (!apiKey || !apiKey.is_active) {
    return jsonResponse({ error: "Invalid or inactive API key" }, 401);
  }

  let resolvedSessionId = sessionId ?? null;

  if (resolvedSessionId) {
    const { data: existing, error: existingError } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", resolvedSessionId)
      .eq("project_id", apiKey.project_id)
      .maybeSingle();

    if (existingError) {
      return jsonResponse({ error: "Session lookup failed" }, 500);
    }
    if (!existing) {
      resolvedSessionId = null;
    } else {
      await supabase
        .from("sessions")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", resolvedSessionId);
    }
  }

  if (!resolvedSessionId) {
    const { data: newSession, error: createSessionError } = await supabase
      .from("sessions")
      .insert({
        project_id: apiKey.project_id,
        end_user_id: endUserId,
        user_agent: userAgent ?? null,
      })
      .select("id")
      .single();

    if (createSessionError) {
      return jsonResponse({ error: "Failed to create session" }, 500);
    }
    resolvedSessionId = newSession.id;
  }

  const { error: eventError } = await supabase.from("analytics_events").insert({
    project_id: apiKey.project_id,
    tour_id: tourId,
    tour_version_id: tourVersionId,
    step_id: stepId ?? null,
    session_id: resolvedSessionId,
    event_type: eventType,
    metadata: metadata ?? {},
  });

  if (eventError) {
    return jsonResponse({ error: "Failed to record event" }, 500);
  }

  return jsonResponse({ sessionId: resolvedSessionId });
});
