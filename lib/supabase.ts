import { createClient } from "@supabase/supabase-js";

// Browser client (anon key)
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    auth: {
      persistSession: true,
      storageKey: "hh-supabase-auth",
      autoRefreshToken: true,
    },
  });
}

// Server client (optionally use service role for server-only calls)
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}
