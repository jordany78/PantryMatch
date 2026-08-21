import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/ingredients/search?q=ban
// Requires an authenticated Supabase session.
// Fuzzy search against the canonical ingredients table for manual pantry add.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ ingredients: [] });
  }

  const supabase = createClient();

  // ilike works out of the box with no extra setup. Once pg_trgm's similarity
  // ranking is worth the extra plumbing (an RPC function), swap this for a
  // similarity()-ordered query so close-but-not-substring matches (e.g. a
  // typo) also surface.
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .ilike("name", `%${q}%`)
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ingredients: data });
}
