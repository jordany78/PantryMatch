import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses Row Level Security entirely.
// Server-only: never import this in anything that ships to the browser.
//
// Keep this client for trusted server-only jobs that intentionally need to
// bypass RLS. User-facing routes must use src/lib/supabase/server.ts instead.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
