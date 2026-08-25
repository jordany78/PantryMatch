import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/server";
import { searchQuerySchema } from "@/lib/validation";

// GET /api/ingredients/search?q=ban
// Requires an authenticated Supabase session.
// Similarity-ranked search against ingredient names and aliases.
export async function GET(req: NextRequest) {
  const parsed = searchQuerySchema.safeParse({ q: req.nextUrl.searchParams.get("q") ?? undefined });
  if (!parsed.success) {
    return NextResponse.json({ ingredients: [] });
  }
  const { q } = parsed.data;

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("search_ingredients", {
    search_query: q,
    result_limit: 10,
    min_similarity: 0.15,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ingredients: data });
}
