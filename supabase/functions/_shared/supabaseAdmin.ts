import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Uses the service_role key, which bypasses Row Level Security entirely. Only ever
 * call this from within an Edge Function (never expose this key to the browser). It's
 * what lets these functions read/write the `secrets` and `app_config` tables that RLS
 * blocks for every other role.
 */
export function createAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}
