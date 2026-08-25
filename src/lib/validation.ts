import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const ingredientResolveSchema = z.object({
  spoonacularId: z.number().int().positive(),
  name: z.string().trim().min(1),
  category: z.string().trim().min(1).optional(),
});

export const pantryItemSchema = z.object({
  ingredient_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string().trim().min(1),
  storage_location: z.enum(["fridge", "freezer", "pantry"]),
  expires_at: z.string().date().nullable().optional(),
});

const confirmedLineItemSchema = z.object({
  id: z.string().uuid(),
  confirmed: z.literal(true),
  ingredient_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string().trim().min(1),
  storage_location: z.enum(["fridge", "freezer", "pantry"]),
});

const rejectedLineItemSchema = z.object({
  id: z.string().uuid(),
  confirmed: z.literal(false),
  ingredient_id: z.string().uuid().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().trim().min(1).optional(),
  storage_location: z.enum(["fridge", "freezer", "pantry"]).optional(),
});

export const receiptLineItemsSchema = z.object({
  line_items: z.array(
    z.discriminatedUnion("confirmed", [confirmedLineItemSchema, rejectedLineItemSchema])
  ).min(1),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1),
});

export const spoonacularSearchQuerySchema = z.object({
  q: z.string().trim().min(2),
});

export const recipeQuerySchema = z.object({
  sort: z.enum(["match_desc", "match_asc", "prep_time"]).default("match_desc"),
  cuisine: z.string().trim().optional(),
  min_match: z.coerce.number().finite().min(0).max(100).optional(),
});

export const receiptUploadSchema = z.object({
  file: z.custom<File>((value) => typeof File !== "undefined" && value instanceof File),
});

export function validationError(error: z.ZodError) {
  return NextResponse.json(
    { error: "Invalid request", details: error.flatten().fieldErrors },
    { status: 400 }
  );
}

export async function parseJson<T extends z.ZodType>(request: NextRequest, schema: T): Promise<z.infer<T> | NextResponse> {
  try {
    const result = schema.safeParse(await request.json());
    return result.success ? result.data : validationError(result.error);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
}

export async function parseFormData<T extends z.ZodType>(request: NextRequest, schema: T): Promise<z.infer<T> | NextResponse> {
  try {
    const result = schema.safeParse(Object.fromEntries(await request.formData()));
    return result.success ? result.data : validationError(result.error);
  } catch {
    return NextResponse.json({ error: "Request body must be valid form data" }, { status: 400 });
  }
}
