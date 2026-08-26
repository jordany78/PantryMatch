import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/server";
import { pantryItemSchema, parseJson } from "@/lib/validation";

// GET /api/pantry/items
export async function GET(req: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("pantry_items")
    .select("*, ingredients(name, category)")
    .eq("user_id", user.id)
    .order("purchase_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}

// POST /api/pantry/items
// Body: { ingredient_id, quantity, unit, storage_location, expires_at? }
export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, pantryItemSchema);
  if (parsed instanceof NextResponse) return parsed;
  const { ingredient_id, quantity, unit, storage_location, expires_at } = parsed;

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("pantry_items")
    .insert({
      user_id: user.id,
      ingredient_id,
      quantity,
      unit,
      storage_location,
      expires_at: expires_at ?? null,
      source: "manual",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
