export interface Ingredient {
  id: string;
  name: string;
  category: string | null;
  defaultUnit: string | null;
  aliases: string[];
}

export interface PantryItem {
  id: string;
  userId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  storageLocation: "fridge" | "freezer" | "pantry";
  purchaseDate: string;
  expiresAt: string | null;
  source: "receipt" | "manual";
}

export interface Receipt {
  id: string;
  userId: string;
  imageUrl: string;
  uploadedAt: string;
  status: "processing" | "reviewed" | "failed";
}

export interface ReceiptLineItem {
  id: string;
  receiptId: string;
  rawText: string;
  matchedIngredientId: string | null;
  quantity: number | null;
  unit: string | null;
  price: number | null;
  confidenceScore: number;
  confirmed: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: string | null;
  prepTimeMinutes: number | null;
  instructions: string;
  dietaryTags: string[];
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  isOptional: boolean;
}
