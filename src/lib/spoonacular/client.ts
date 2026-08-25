const SPOONACULAR_BASE_URL = "https://api.spoonacular.com";

export interface SpoonacularAutocompleteResult {
  id: number;
  name: string;
  image: string;
  aisle?: string;
  possibleUnits?: string[];
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