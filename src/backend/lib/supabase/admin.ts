import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses Row Level Security entirely.
// Server-only: never import this in anything that ships to the browser.
//
// Used for now because there's no frontend auth flow wired up yet, so routes
// can't read a real session from cookies. Once Supabase Auth is wired in on
// the frontend, swap routes over to src/lib/supabase/server.ts (which reads
// the authenticated user's session) and drop the user_id-in-request pattern
// below.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
