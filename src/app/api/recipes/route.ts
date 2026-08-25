import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeMatch } from "@/lib/matching/computeMatch";
import { searchRecipes, type SpoonacularRecipe } from "@/lib/spoonacular/client";
import type { PantryItem, Recipe, RecipeIngredient } from "@/types";

async function importRecipe(recipe: SpoonacularRecipe) {
  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("recipes")
    .select("id")
    .eq("spoonacular_id", recipe.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return;

  const { data: created, error: recipeError } = await admin
    .from("recipes")
    .insert({
      spoonacular_id: recipe.id,
      name: recipe.title,
      cuisine: recipe.cuisines[0] ?? null,
      prep_time_minutes: recipe.readyInMinutes,
      instructions: recipe.instructions ?? "Instructions unavailable.",
      dietary_tags: recipe.diets ?? [],
    })
    .select("id")
    .single();

  if (recipeError || !created) throw recipeError ?? new Error("Recipe import failed");

  const ingredientRows = [];
  for (const ingredient of recipe.extendedIngredients ?? []) {
    const { data: byExternalId } = await admin
      .from("ingredients")
      .select("id")
      .eq("spoonacular_id", ingredient.id)
      .maybeSingle();

    let ingredientId = byExternalId?.id;
    if (!ingredientId) {
      const { data: byName } = await admin
        .from("ingredients")
        .select("id")
        .ilike("name", ingredient.name)
        .maybeSingle();
      ingredientId = byName?.id;
    }

    if (!ingredientId) {
      const { data: createdIngredient, error: ingredientError } = await admin
        .from("ingredients")
        .insert({ name: ingredient.name, spoonacular_id: ingredient.id })
        .select("id")
        .single();
      if (ingredientError || !createdIngredient) throw ingredientError ?? new Error("Ingredient import failed");
      ingredientId = createdIngredient.id;
    }

    ingredientRows.push({
      recipe_id: created.id,
      ingredient_id: ingredientId,
      quantity: ingredient.amount ?? 0,
      unit: ingredient.unit || "each",
      is_optional: false,
    });
  }

  if (ingredientRows.length > 0) {
    const { error } = await admin.from("recipe_ingredients").insert(ingredientRows);
    if (error) throw error;
  }
}

// GET /api/recipes?sort=match_desc&cuisine=Italian&diet=vegetarian&min_match=50&max_prep=30
//
// Lists all recipes with a computed match % against the user's pantry.
// Query params:
//   sort       match_desc (default) | match_asc | prep_time
//   cuisine    exact match on recipes.cuisine
//   diet       recipe dietary tag, such as vegetarian
//   min_match  only return recipes at or above this match % (0-100)
//   max_prep   only return recipes at or below this prep time in minutes
export async function GET(req: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  const sort = req.nextUrl.searchParams.get("sort") ?? "match_desc";
  const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const cuisine = req.nextUrl.searchParams.get("cuisine");
  const diet = req.nextUrl.searchParams.get("diet");
  const minMatchParam = req.nextUrl.searchParams.get("min_match");
  const minMatch = minMatchParam ? Number(minMatchParam) : null;
  const maxPrepParam = req.nextUrl.searchParams.get("max_prep");
  const maxPrep = maxPrepParam ? Number(maxPrepParam) : null;

  // Pull everything needed to compute match % for every recipe in one pass,
  // rather than querying per-recipe — cheap at this catalog size, and keeps
  // this route to a handful of queries instead of N+1.
  let recipeQuery = supabase.from("recipes").select("*");
  if (query) {
    recipeQuery = recipeQuery.ilike("name", `%${query}%`);
  }
  if (cuisine) {
    recipeQuery = recipeQuery.eq("cuisine", cuisine);
  }
  if (diet) {
    recipeQuery = recipeQuery.contains("dietary_tags", [diet]);
  }
  if (maxPrep !== null && !Number.isNaN(maxPrep)) {
    recipeQuery = recipeQuery.lte("prep_time_minutes", maxPrep);
  }

  const [{ data: recipesRaw, error: recipesError }, { data: recipeIngredientsRaw, error: riError }, { data: pantryItemsRaw, error: pantryError }] =
    await Promise.all([
      recipeQuery,
      supabase.from("recipe_ingredients").select("*, ingredients(id, name)"),
      supabase.from("pantry_items").select("*").eq("user_id", user.id),
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

  if (query && (recipesRaw ?? []).length === 0) {
    try {
      const spoonacularRecipes = await searchRecipes(query);
      await Promise.all(spoonacularRecipes.map(importRecipe));
      if (spoonacularRecipes.length > 0) return GET(req);
    } catch (error) {
      if (error instanceof Error && error.message === "SPOONACULAR_QUOTA_EXCEEDED") {
        return NextResponse.json({ error: "Recipe search is temporarily unavailable." }, { status: 503 });
      }
      console.error("Spoonacular recipe import error:", error);
      return NextResponse.json({ error: "Could not import recipes from Spoonacular." }, { status: 502 });
    }
  }

  const ingredientNameById = new Map(
    (recipeIngredientsRaw ?? []).map((ri: any) => [
      ri.ingredient_id,
      ri.ingredients?.name ?? "Unknown ingredient",
    ])
  );

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
    return {
      ...recipe,
      match: {
        ...match,
        missingIngredients: match.missingIngredientIds.map((ingredientId) => ({
          ingredientId,
          name: ingredientNameById.get(ingredientId),
        })),
      },
    };
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
