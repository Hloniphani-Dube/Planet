import { corsHeaders } from "../_shared/cors.ts";
import { jsonError, jsonOk } from "../_shared/http.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { PROVIDER_IDS } from "../_shared/providers/index.ts";
import type { AiProvider } from "../_shared/types.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Sign in required.", 401);

  const { provider, apiKey } = await req.json();
  if (typeof provider !== "string" || !PROVIDER_IDS.includes(provider as AiProvider)) {
    return jsonError("Unknown AI provider.", 400);
  }

  const trimmedKey = typeof apiKey === "string" ? apiKey.trim() : "";
  if (trimmedKey.length < 10) {
    return jsonError("That doesn't look like a valid API key.", 400);
  }

  const admin = createAdminClient();
  const { error } = await admin.from("secrets").upsert({
    provider,
    api_key: trimmedKey,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  });

  if (error) {
    console.error("save-api-key failed", error);
    return jsonError("Couldn't save that key.", 500);
  }

  return jsonOk();
});
