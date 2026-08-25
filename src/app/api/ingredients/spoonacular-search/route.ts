import { NextRequest, NextResponse } from "next/server";
import { searchIngredients } from "@/lib/spoonacular/client";
import { spoonacularSearchQuerySchema } from "@/lib/validation";

// GET /api/ingredients/spoonacular-search?q=chick
// Autocomplete against Spoonacular's ingredient catalog: used when a local
// search (see /api/ingredients/search) doesn't find a match, so the user
// can pull in a new ingredient from Spoonacular instead.
export async function GET(request: NextRequest) {
  const parsed = spoonacularSearchQuerySchema.safeParse({ q: request.nextUrl.searchParams.get("q") ?? undefined });
  if (!parsed.success) {
    return NextResponse.json({ results: [] });
  }
  const { q } = parsed.data;

  try {
    const results = await searchIngredients(q);
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof Error && err.message === "SPOONACULAR_QUOTA_EXCEEDED") {
      return NextResponse.json(
        { error: "Ingredient search is temporarily unavailable." },
        { status: 503 }
      );
    }
    console.error("Spoonacular search error:", err);
    return NextResponse.json(
      { error: "Something went wrong searching ingredients." },
      { status: 500 }
    );
  }
}