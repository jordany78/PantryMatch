import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/ingredients/resolve
// Body: { spoonacularId: number, name: string, category?: string }
//
// Find-or-create: if an ingredient with this spoonacular_id already exists
// locally, return it. Otherwise insert a new local ingredients row and
// return that. This is the only place a Spoonacular suggestion turns into
// a row other tables (pantry_items, recipe_ingredients) can reference.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { spoonacularId, name, category, defaultUnit } = body;

  if (!spoonacularId || !name) {
    return NextResponse.json(
      { error: "spoonacularId and name are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // 1. Check if we've already imported this Spoonacular ingredient
  const { data: existing, error: findError } = await supabase
    .from("ingredients")
    .select("*")
    .eq("spoonacular_id", spoonacularId)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ ingredient: existing });
  }

  // 2. Not found locally, insert it
  const { data: created, error: insertError } = await supabase
    .from("ingredients")
    .insert({
      name,
      category: category ?? null,
      default_unit: defaultUnit ?? null,
      spoonacular_id: spoonacularId,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ingredient: created });
}