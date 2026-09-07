import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeMatch } from "@/lib/matching/computeMatch";
import { recipeQuerySchema, validationError } from "@/lib/validation";
import { searchRecipes, type SpoonacularRecipe } from "@/lib/spoonacular/client";
import type { PantryItem, Recipe, RecipeIngredient } from "@/types";

async function importRecipe(recipe: SpoonacularRecipe) {
  const admin = createAdminClient();
  const cuisines = Array.isArray(recipe.cuisines)
    ? recipe.cuisines.filter((cuisine) => typeof cuisine === "string" && cuisine.trim())
    : [];
  const dietaryTags = Array.isArray(recipe.diets)
    ? recipe.diets.filter((tag) => typeof tag === "string" && tag.trim())
    : [];
  const instructions =
    typeof recipe.instructions === "string" && recipe.instructions.trim()
      ? recipe.instructions
      : "Instructions unavailable.";

  const { data: existing, error: existingError } = await admin
    .from("recipes")
    .select("id, cuisine, instructions, dietary_tags")
    .eq("spoonacular_id", recipe.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    const updates: Record<string, unknown> = {};
    if (!existing.cuisine && cuisines.length > 0) updates.cuisine = cuisines.join(", ");
    if (!existing.instructions || existing.instructions === "Instructions unavailable.") {
      updates.instructions = instructions;
    }
    if ((!existing.dietary_tags || existing.dietary_tags.length === 0) && dietaryTags.length > 0) {
      updates.dietary_tags = dietaryTags;
    }
    if (Object.keys(updates).length > 0) {
      const { error } = await admin.from("recipes").update(updates).eq("id", existing.id);
      if (error) throw error;
    }
    return;
  }

  const { data: created, error: recipeError } = await admin
    .from("recipes")
    .insert({
      spoonacular_id: recipe.id,
      name: recipe.title,
      cuisine: cuisines.length > 0 ? cuisines.join(", ") : null,
      prep_time_minutes: recipe.readyInMinutes,
      instructions,
      dietary_tags: dietaryTags,
    })
    .select("id")
    .single();

  if (recipeError) {
    if (recipeError.code !== "23505") throw recipeError;
    const { data: concurrentRecipe, error: concurrentRecipeError } = await admin
      .from("recipes")
      .select("id")
      .eq("spoonacular_id", recipe.id)
      .single();
    if (concurrentRecipeError || !concurrentRecipe) {
      throw concurrentRecipeError ?? new Error("Recipe import failed");
    }
    return;
  }
  if (!created) throw new Error("Recipe import failed");

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
      if (ingredientError) {
        if (ingredientError.code !== "23505") throw ingredientError;
        const { data: concurrentIngredient, error: concurrentIngredientError } = await admin
          .from("ingredients")
          .select("id")
          .eq("spoonacular_id", ingredient.id)
          .single();
        if (concurrentIngredientError || !concurrentIngredient) {
          throw concurrentIngredientError ?? new Error("Ingredient import failed");
        }
        ingredientId = concurrentIngredient.id;
      } else {
        if (!createdIngredient) throw new Error("Ingredient import failed");
        ingredientId = createdIngredient.id;
      }
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
//   cuisine    case-insensitive partial match on recipes.cuisine
//   diet       case-insensitive partial recipe dietary tag, such as vegetarian
//   min_match  only return recipes at or above this match % (0-100)
//   max_prep   only return recipes at or below this prep time in minutes
export async function GET(req: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  const parsedQuery = recipeQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );
  if (!parsedQuery.success) return validationError(parsedQuery.error);
  const {
    sort,
    q: query = "",
    cuisine,
    diet,
    min_match: minMatch,
    max_prep: maxPrep,
  } = parsedQuery.data;
  const normalizedCuisine = cuisine?.trim().toLowerCase();
  const normalizedDiet = diet?.trim().toLowerCase();

  // Pull everything needed to compute match % for every recipe in one pass,
  // rather than querying per-recipe — cheap at this catalog size, and keeps
  // this route to a handful of queries instead of N+1.
  let recipeQuery = supabase.from("recipes").select("*");
  if (query) {
    recipeQuery = recipeQuery.ilike("name", `%${query}%`);
  }
  if (maxPrep !== undefined) {
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
  })).filter((recipe) => {
    const cuisineMatches = !normalizedCuisine ||
      recipe.cuisine?.trim().toLowerCase().includes(normalizedCuisine);
    const dietMatches = !normalizedDiet || recipe.dietaryTags.some(
      (tag: string) => tag.trim().toLowerCase().includes(normalizedDiet)
    );
    return cuisineMatches && dietMatches;
  });

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
        partialIngredients: match.partialIngredientIds.map((ingredientId) => ({
          ingredientId,
          name: ingredientNameById.get(ingredientId),
        })),
      },
    };
  });

  if (minMatch !== undefined) {
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
