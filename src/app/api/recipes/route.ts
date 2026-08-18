import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeMatch } from "@/lib/matching/computeMatch";
import type { PantryItem, Recipe, RecipeIngredient } from "@/types";

// GET /api/recipes?user_id=<uuid>&sort=match_desc&cuisine=Italian&min_match=50
//
// Lists all recipes with a computed match % against the user's pantry.
// TEMP: user_id is a query param until real auth is wired in (see the same
// note on /api/pantry/items).
//
// Query params:
//   user_id    (required) — whose pantry to match against
//   sort       match_desc (default) | match_asc | prep_time
//   cuisine    exact match on recipes.cuisine
//   min_match  only return recipes at or above this match % (0-100)
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json(
      { error: "user_id query param is required" },
      { status: 400 }
    );
  }

  const sort = req.nextUrl.searchParams.get("sort") ?? "match_desc";
  const cuisine = req.nextUrl.searchParams.get("cuisine");
  const minMatchParam = req.nextUrl.searchParams.get("min_match");
  const minMatch = minMatchParam ? Number(minMatchParam) : null;

  const supabase = createAdminClient();

  // Pull everything needed to compute match % for every recipe in one pass,
  // rather than querying per-recipe — cheap at this catalog size, and keeps
  // this route to a handful of queries instead of N+1.
  let recipeQuery = supabase.from("recipes").select("*");
  if (cuisine) {
    recipeQuery = recipeQuery.eq("cuisine", cuisine);
  }

  const [{ data: recipesRaw, error: recipesError }, { data: recipeIngredientsRaw, error: riError }, { data: pantryItemsRaw, error: pantryError }] =
    await Promise.all([
      recipeQuery,
      supabase.from("recipe_ingredients").select("*"),
      supabase.from("pantry_items").select("*").eq("user_id", userId),
    ]);

  if (recipesError) {
    return NextResponse.json({ error: recipesError.message }, { status: 500 });
  }
  if (riError) {
    return NextResponse.json({ error: riError.message }, { status: 500 });
  }
  if (pantryError) {
    return NextResponse.json({ error: pantryError.message }, { status: 500 });
  }

  const recipes: Recipe[] = (recipesRaw ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    cuisine: r.cuisine,
    prepTimeMinutes: r.prep_time_minutes,
    instructions: r.instructions,
    dietaryTags: r.dietary_tags ?? [],
  }));

  const recipeIngredients: RecipeIngredient[] = (recipeIngredientsRaw ?? []).map(
    (ri) => ({
      id: ri.id,
      recipeId: ri.recipe_id,
      ingredientId: ri.ingredient_id,
      quantity: ri.quantity,
      unit: ri.unit,
      isOptional: ri.is_optional,
    })
  );

  const pantryItems: PantryItem[] = (pantryItemsRaw ?? []).map((p) => ({
    id: p.id,
    userId: p.user_id,
    ingredientId: p.ingredient_id,
    quantity: p.quantity,
    unit: p.unit,
    storageLocation: p.storage_location,
    purchaseDate: p.purchase_date,
    expiresAt: p.expires_at,
    source: p.source,
  }));

  let results = recipes.map((recipe) => {
    const ingredientsForRecipe = recipeIngredients.filter(
      (ri) => ri.recipeId === recipe.id
    );
    const match = computeMatch(recipe, ingredientsForRecipe, pantryItems);
    return { ...recipe, match };
  });

  if (minMatch !== null && !Number.isNaN(minMatch)) {
    results = results.filter((r) => r.match.matchPercent >= minMatch);
  }

  results.sort((a, b) => {
    if (sort === "match_asc") return a.match.matchPercent - b.match.matchPercent;
    if (sort === "prep_time")
      return (a.prepTimeMinutes ?? Infinity) - (b.prepTimeMinutes ?? Infinity);
    // default: match_desc
    return b.match.matchPercent - a.match.matchPercent;
  });

  return NextResponse.json({ recipes: results });
}
