import { corsHeaders } from "../_shared/cors.ts";
import { jsonError } from "../_shared/http.ts";
import { getUserFromRequest } from "../_shared/auth.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { PROVIDERS, PROVIDER_IDS } from "../_shared/providers/index.ts";
import type { AiProvider } from "../_shared/types.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Sign in required.", 401);

  const admin = createAdminClient();
  const [{ data: secretRows }, { data: configRow }] = await Promise.all([
    admin.from("secrets").select("provider"),
    admin.from("app_config").select("value").eq("key", "active_provider").maybeSingle(),
  ]);

  const withKey = new Set((secretRows ?? []).map((row) => row.provider as AiProvider));
  const active = configRow?.value as AiProvider | undefined;

  const rows = PROVIDER_IDS.map((id) => ({
    id,
    label: PROVIDERS[id].label,
    hasKey: withKey.has(id),
    active: active === id,
  }));

  return new Response(JSON.stringify(rows), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
