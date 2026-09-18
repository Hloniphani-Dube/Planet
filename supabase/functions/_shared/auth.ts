import { createClient, type User } from "npm:@supabase/supabase-js@2";

/** Verifies the caller's JWT and returns the user it belongs to, or null if absent/invalid. */
export async function getUserFromRequest(req: Request): Promise<User | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
