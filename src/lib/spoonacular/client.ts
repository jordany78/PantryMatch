const SPOONACULAR_BASE_URL = "https://api.spoonacular.com";

export interface SpoonacularAutocompleteResult {
  id: number;
  name: string;
  image: string;
  aisle?: string;
  possibleUnits?: string[];
}

export interface SpoonacularRecipeIngredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  original: string;
}

export interface SpoonacularRecipe {
  id: number;
  title: string;
  readyInMinutes: number | null;
  cuisines: string[];
  diets: string[];
  instructions: string | null;
  extendedIngredients: SpoonacularRecipeIngredient[];
}

/**
 * Autocomplete search against Spoonacular's ingredient database.
 * Used to power the "add pantry item" search box.
 * Costs a small number of Spoonacular API points per call: keep number low.
 */
export async function searchIngredients(
  query: string, 
  limit: number = 5
  ): Promise<SpoonacularAutocompleteResult[]> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    throw new Error("SPOONACULAR_API_KEY is not set");
  }

  const url = new URL(`${SPOONACULAR_BASE_URL}/food/ingredients/autocomplete`);
  url.searchParams.set("query", query);
  url.searchParams.set("number", String(limit));
  url.searchParams.set("metaInformation", "true");
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url.toString());

  if (!res.ok) {
    // Spoonacular returns 402 when you've hit your daily point quota
    if (res.status === 402) {
      throw new Error("SPOONACULAR_QUOTA_EXCEEDED");
    }
    throw new Error(`Spoonacular request failed: ${res.status}`);
  }

  return res.json();
}

export async function searchRecipes(query: string, limit = 10): Promise<SpoonacularRecipe[]> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error("SPOONACULAR_API_KEY is not set");

  const url = new URL(`${SPOONACULAR_BASE_URL}/recipes/complexSearch`);
  url.searchParams.set("query", query);
  url.searchParams.set("number", String(limit));
  url.searchParams.set("addRecipeInformation", "true");
  url.searchParams.set("fillIngredients", "true");
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    if (res.status === 402) throw new Error("SPOONACULAR_QUOTA_EXCEEDED");
    throw new Error(`Spoonacular request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.results ?? [];
}