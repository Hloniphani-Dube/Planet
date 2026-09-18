import { createClient, type User } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Falls back to a syntactically valid placeholder so the client can construct without
// throwing when `.env` isn't set up yet. Callers should check `isSupabaseConfigured`
// before actually using it. Without this, a missing `.env` crashes the whole app at
// module-load time (before React renders anything), producing a blank page.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
);

export async function ensureAnonymousSession(): Promise<User> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return session.user;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user!;
}
