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

  it("converts weight units like oz to g accurately", () => {
    // 4 oz = ~113.4g. Recipe requires 100g -> 100% match
    const recipeIngredients = [
      ingredient({ ingredientId: "cheese", quantity: 100, unit: "g" }),
    ];
    const pantryItems = [pantryItem({ ingredientId: "cheese", quantity: 4, unit: "oz" })];

    const result = computeMatch(recipe, recipeIngredients, pantryItems);

    expect(result.matchedIngredientIds).toEqual(["cheese"]);
    expect(result.matchPercent).toBe(100);
  });

  it("calculates partial match when converting g to oz", () => {
    // Recipe requires 8 oz (~226.8g), pantry has 100g -> 100 / 226.8 = ~44%
    const recipeIngredients = [
      ingredient({ ingredientId: "cheese", quantity: 8, unit: "oz" }),
    ];
    const pantryItems = [pantryItem({ ingredientId: "cheese", quantity: 100, unit: "g" })];

    const result = computeMatch(recipe, recipeIngredients, pantryItems);

    expect(result.partialIngredientIds).toEqual(["cheese"]);
    expect(result.matchPercent).toBe(44);
  });

  it("converts volume units across cups, tbsp, and fl oz", () => {
    // 1 cup = 16 tbsp. Recipe needs 1 cup, pantry has 16 tbsp -> 100% match
    const recipeIngredients = [
      ingredient({ ingredientId: "milk", quantity: 1, unit: "cup" }),
    ];
    const pantryItems = [pantryItem({ ingredientId: "milk", quantity: 16, unit: "tbsp" })];

    const result = computeMatch(recipe, recipeIngredients, pantryItems);

    expect(result.matchedIngredientIds).toEqual(["milk"]);
    expect(result.matchPercent).toBe(100);
  });

  it("normalizes unit strings with punctuation, casing, and abbreviations", () => {
    const recipeIngredients = [
      ingredient({ ingredientId: "olive-oil", quantity: 2, unit: "FL. OZ." }),
      ingredient({ ingredientId: "butter", quantity: 8, unit: "oz." }),
    ];
    const pantryItems = [
      pantryItem({ ingredientId: "olive-oil", quantity: 4, unit: "tbsp" }), // 4 tbsp = ~2 fl oz
      pantryItem({ ingredientId: "butter", quantity: 0.5, unit: "lbs" }), // 0.5 lb = 8 oz
    ];

    const result = computeMatch(recipe, recipeIngredients, pantryItems);

    expect(result.matchedIngredientIds).toEqual(["olive-oil", "butter"]);
    expect(result.matchPercent).toBe(100);
  });

  it("compares discrete count units (e.g. cans, cloves, each)", () => {
    const recipeIngredients = [
      ingredient({ ingredientId: "garlic", quantity: 4, unit: "cloves" }),
    ];
    const pantryItems = [
      pantryItem({ ingredientId: "garlic", quantity: 2, unit: "cloves" }),
    ];

    const result = computeMatch(recipe, recipeIngredients, pantryItems);

    expect(result.partialIngredientIds).toEqual(["garlic"]);
    expect(result.matchPercent).toBe(50);
  });
});
