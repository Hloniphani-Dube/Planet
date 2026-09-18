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

  const { provider } = await req.json();
  if (typeof provider !== "string" || !PROVIDER_IDS.includes(provider as AiProvider)) {
    return jsonError("Unknown AI provider.", 400);
  }

  const admin = createAdminClient();
  const { data: keyRow } = await admin
    .from("secrets")
    .select("provider")
    .eq("provider", provider)
    .maybeSingle();

  if (!keyRow) {
    return jsonError("Add an API key for this provider first.", 412);
  }

  await admin.from("app_config").upsert({ key: "active_provider", value: provider });
  return jsonOk();
});
