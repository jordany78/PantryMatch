import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeMatch } from "@/lib/matching/computeMatch";
import type { PantryItem, Recipe, RecipeIngredient } from "@/types";

// GET /api/recipes/:id/match?user_id=<uuid>
//
// Detailed match breakdown for a single recipe: match %, and the matched vs.
// missing ingredients by name (not just id), so the UI can render something
// like "You're missing: garlic, heavy cream" directly.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json(
      { error: "user_id query param is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: recipeRaw, error: recipeError } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (recipeError || !recipeRaw) {
    return NextResponse.json({ error: "recipe not found" }, { status: 404 });
  }

  const [{ data: recipeIngredientsRaw, error: riError }, { data: pantryItemsRaw, error: pantryError }] =
    await Promise.all([
      supabase
        .from("recipe_ingredients")
        .select("*, ingredients(id, name, category)")
        .eq("recipe_id", id),
      supabase.from("pantry_items").select("*").eq("user_id", userId),
    ]);

  if (riError) {
    return NextResponse.json({ error: riError.message }, { status: 500 });
  }
  if (pantryError) {
    return NextResponse.json({ error: pantryError.message }, { status: 500 });
  }

  const recipe: Recipe = {
    id: recipeRaw.id,
    name: recipeRaw.name,
    cuisine: recipeRaw.cuisine,
    prepTimeMinutes: recipeRaw.prep_time_minutes,
    instructions: recipeRaw.instructions,
    dietaryTags: recipeRaw.dietary_tags ?? [],
  };

  const recipeIngredients: RecipeIngredient[] = (recipeIngredientsRaw ?? []).map(
    (ri: any) => ({
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

  const match = computeMatch(recipe, recipeIngredients, pantryItems);

  // Attach ingredient names to the matched/missing id lists so the UI
  // doesn't need a second round trip just to display them.
  const ingredientNameById = new Map(
    (recipeIngredientsRaw ?? []).map((ri: any) => [
      ri.ingredient_id,
      ri.ingredients?.name ?? "Unknown ingredient",
    ])
  );

  const missingIngredients = match.missingIngredientIds.map((ingredientId) => ({
    ingredientId,
    name: ingredientNameById.get(ingredientId),
  }));

  const matchedIngredients = match.matchedIngredientIds.map((ingredientId) => ({
    ingredientId,
    name: ingredientNameById.get(ingredientId),
  }));

  return NextResponse.json({
    recipe,
    matchPercent: match.matchPercent,
    matchedIngredients,
    missingIngredients,
  });
}
