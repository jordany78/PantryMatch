import type { PantryItem, Recipe, RecipeIngredient } from "@/types";

export interface MatchResult {
  recipeId: string;
  matchPercent: number;
  matchedIngredientIds: string[];
  missingIngredientIds: string[];
}

// Computes match % = (ingredients on hand / total required ingredients) x 100
// for a single recipe against a user's current pantry.
//
// Refinements to consider later: weighting core vs. garnish ingredients,
// treating `is_optional` ingredients as bonus rather than required,
// and quantity-aware partial credit.
export function computeMatch(
  recipe: Recipe,
  recipeIngredients: RecipeIngredient[],
  pantryItems: PantryItem[]
): MatchResult {
  const required = recipeIngredients.filter((ri) => !ri.isOptional);
  const pantryIngredientIds = new Set(
    pantryItems.map((item) => item.ingredientId)
  );

  const matched = required.filter((ri) =>
    pantryIngredientIds.has(ri.ingredientId)
  );
  const missing = required.filter(
    (ri) => !pantryIngredientIds.has(ri.ingredientId)
  );

  const matchPercent =
    required.length === 0
      ? 0
      : Math.round((matched.length / required.length) * 100);

  return {
    recipeId: recipe.id,
    matchPercent,
    matchedIngredientIds: matched.map((ri) => ri.ingredientId),
    missingIngredientIds: missing.map((ri) => ri.ingredientId),
  };
}
