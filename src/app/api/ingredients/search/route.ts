import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/server";

// GET /api/ingredients/search?q=ban
// Requires an authenticated Supabase session.
// Similarity-ranked search against ingredient names and aliases.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ ingredients: [] });
  }

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("search_ingredients", {
    search_query: q.trim(),
    result_limit: 10,
    min_similarity: 0.15,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ingredients: data });
}
