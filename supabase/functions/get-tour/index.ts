import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  let publicKey: string | null = null;
  if (req.method === "GET") {
    publicKey = new URL(req.url).searchParams.get("publicKey");
  } else if (req.method === "POST") {
    const body = await req.json().catch(() => null);
    publicKey = body?.publicKey ?? null;
  }

  if (!publicKey) {
    return jsonResponse({ error: "Missing publicKey" }, 400);
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

  const { data: tours, error: toursError } = await supabase
    .from("tours")
    .select("id, name, published_version_id")
    .eq("project_id", apiKey.project_id)
    .eq("status", "published")
    .not("published_version_id", "is", null);

  if (toursError) {
    return jsonResponse({ error: "Failed to load tours" }, 500);
  }

  const versionIds = tours.map((t) => t.published_version_id).filter((id): id is string => !!id);

  const stepsByVersion = new Map<string, unknown[]>();
  if (versionIds.length > 0) {
    const { data: steps, error: stepsError } = await supabase
      .from("steps")
      .select("id, tour_version_id, step_type, position, title, content, target_selector")
      .in("tour_version_id", versionIds)
      .order("position", { ascending: true });

    if (stepsError) {
      return jsonResponse({ error: "Failed to load steps" }, 500);
    }

    for (const step of steps) {
      const list = stepsByVersion.get(step.tour_version_id) ?? [];
      list.push({
        id: step.id,
        stepType: step.step_type,
        position: step.position,
        title: step.title,
        content: step.content,
        targetSelector: step.target_selector,
      });
      stepsByVersion.set(step.tour_version_id, list);
    }
  }

  const response = {
    tours: tours.map((tour) => ({
      id: tour.id,
      name: tour.name,
      tourVersionId: tour.published_version_id,
      steps: stepsByVersion.get(tour.published_version_id!) ?? [],
    })),
  };

  return jsonResponse(response);
});
