import { describe, expect, it } from "vitest";
import { computeMatch } from "@/lib/matching/computeMatch";
import type { PantryItem, Recipe, RecipeIngredient } from "@/types";

const recipe: Recipe = {
  id: "recipe-1",
  name: "Test Recipe",
  cuisine: null,
  prepTimeMinutes: null,
  instructions: "",
  dietaryTags: [],
};

function ingredient(overrides: Partial<RecipeIngredient>): RecipeIngredient {
  return {
    id: `ri-${Math.random()}`,
    recipeId: recipe.id,
    ingredientId: "egg",
    quantity: 1,
    unit: "each",
    isOptional: false,
    ...overrides,
  };
}

function pantryItem(overrides: Partial<PantryItem>): PantryItem {
  return {
    id: `p-${Math.random()}`,
    userId: "user-1",
    ingredientId: "egg",
    quantity: 1,
    unit: "each",
    storageLocation: "pantry",
    purchaseDate: "2026-01-01",
    expiresAt: null,
    source: "manual",
    ...overrides,
  };
}

describe("computeMatch", () => {
  it("gives partial credit when pantry quantity is less than required", () => {
    const recipeIngredients = [
      ingredient({ ingredientId: "egg", quantity: 3, unit: "each" }),
    ];
    const pantryItems = [pantryItem({ ingredientId: "egg", quantity: 1, unit: "each" })];

    const result = computeMatch(recipe, recipeIngredients, pantryItems);

    expect(result.partialIngredientIds).toEqual(["egg"]);
    expect(result.matchedIngredientIds).toEqual([]);
    expect(result.missingIngredientIds).toEqual([]);
    expect(result.matchPercent).toBe(33);
  });

  it("marks an ingredient fully matched when pantry quantity meets or exceeds required", () => {
    const recipeIngredients = [
      ingredient({ ingredientId: "egg", quantity: 2, unit: "each" }),
    ];
    const pantryItems = [pantryItem({ ingredientId: "egg", quantity: 3, unit: "each" })];

    const result = computeMatch(recipe, recipeIngredients, pantryItems);

    expect(result.matchedIngredientIds).toEqual(["egg"]);
    expect(result.matchPercent).toBe(100);
  });

  it("marks an ingredient missing when absent from the pantry", () => {
    const recipeIngredients = [ingredient({ ingredientId: "flour", quantity: 200, unit: "g" })];
    const result = computeMatch(recipe, recipeIngredients, []);

    expect(result.missingIngredientIds).toEqual(["flour"]);
    expect(result.matchPercent).toBe(0);
  });

  it("sums multiple pantry items and converts compatible units", () => {
    const recipeIngredients = [
      ingredient({ ingredientId: "flour", quantity: 500, unit: "g" }),
    ];
    const pantryItems = [
      pantryItem({ ingredientId: "flour", quantity: 1, unit: "kg" }),
      pantryItem({ ingredientId: "flour", quantity: 100, unit: "g" }),
    ];

    const result = computeMatch(recipe, recipeIngredients, pantryItems);

    expect(result.matchedIngredientIds).toEqual(["flour"]);
    expect(result.matchPercent).toBe(100);
  });

  it("falls back to have/don't-have when units aren't convertible", () => {
    const recipeIngredients = [
      ingredient({ ingredientId: "garlic", quantity: 2, unit: "cloves" }),
    ];
    const pantryItems = [pantryItem({ ingredientId: "garlic", quantity: 1, unit: "bulb" })];

    const result = computeMatch(recipe, recipeIngredients, pantryItems);

    expect(result.matchedIngredientIds).toEqual(["garlic"]);
    expect(result.matchPercent).toBe(100);
  });

  it("ignores optional ingredients when computing the percentage", () => {
    const recipeIngredients = [
      ingredient({ ingredientId: "egg", quantity: 2, unit: "each" }),
      ingredient({ ingredientId: "parsley", quantity: 1, unit: "each", isOptional: true }),
    ];
    const pantryItems = [pantryItem({ ingredientId: "egg", quantity: 2, unit: "each" })];

    const result = computeMatch(recipe, recipeIngredients, pantryItems);

    expect(result.matchPercent).toBe(100);
    expect(result.missingIngredientIds).toEqual([]);
  });
});
