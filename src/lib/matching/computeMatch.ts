import type { PantryItem, Recipe, RecipeIngredient } from "@/types";
import { toBaseUnit } from "@/lib/utils";

export interface MatchResult {
  recipeId: string;
  matchPercent: number;
  matchedIngredientIds: string[];
  partialIngredientIds: string[];
  missingIngredientIds: string[];
}

// Computes match % as the average "credit" across required ingredients,
// where credit is 0 (don't have), 1 (have enough), or a fraction in between
// (e.g. have 1 egg, need 3 -> 0.33) for partial quantities on hand.
//
// Refinements to consider later: weighting core vs. garnish ingredients,
// treating `is_optional` ingredients as bonus rather than required.
export function computeMatch(
  recipe: Recipe,
  recipeIngredients: RecipeIngredient[],
  pantryItems: PantryItem[]
): MatchResult {
  const required = recipeIngredients.filter((ri) => !ri.isOptional);

  const pantryItemsByIngredientId = new Map<string, PantryItem[]>();
  for (const item of pantryItems) {
    const existing = pantryItemsByIngredientId.get(item.ingredientId);
    if (existing) existing.push(item);
    else pantryItemsByIngredientId.set(item.ingredientId, [item]);
  }

  const matched: RecipeIngredient[] = [];
  const partial: RecipeIngredient[] = [];
  const missing: RecipeIngredient[] = [];
  let creditTotal = 0;

  for (const ri of required) {
    const pantryMatches = pantryItemsByIngredientId.get(ri.ingredientId) ?? [];
    const credit = creditForIngredient(ri, pantryMatches);
    creditTotal += credit;

    if (credit <= 0) missing.push(ri);
    else if (credit >= 1) matched.push(ri);
    else partial.push(ri);
  }

  const matchPercent =
    required.length === 0 ? 0 : Math.round((creditTotal / required.length) * 100);

  return {
    recipeId: recipe.id,
    matchPercent,
    matchedIngredientIds: matched.map((ri) => ri.ingredientId),
    partialIngredientIds: partial.map((ri) => ri.ingredientId),
    missingIngredientIds: missing.map((ri) => ri.ingredientId),
  };
}

// Returns how much of a required ingredient's quantity is covered by the
// pantry, clamped to [0, 1]. Falls back to a binary have/don't-have credit
// when the required or pantry units can't be converted to a common base.
function creditForIngredient(
  required: RecipeIngredient,
  pantryMatches: PantryItem[]
): number {
  if (pantryMatches.length === 0) return 0;
  if (!required.quantity || required.quantity <= 0) return 1;

  const requiredBase = toBaseUnit(required.quantity, required.unit);
  if (!requiredBase) return 1; // unknown required unit: presence is all we can check

  let haveInBase = 0;
  let anyConvertible = false;
  for (const item of pantryMatches) {
    const itemBase = toBaseUnit(item.quantity, item.unit);
    if (itemBase && itemBase.base === requiredBase.base) {
      haveInBase += itemBase.value;
      anyConvertible = true;
    }
  }

  if (!anyConvertible) return 1; // no comparable units, but ingredient is present

  return Math.min(1, haveInBase / requiredBase.value);
}
