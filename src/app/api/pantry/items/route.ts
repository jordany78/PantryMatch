import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/server";

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
  const body = await req.json();
  const { ingredient_id, quantity, unit, storage_location, expires_at } =
    body;

  if (!ingredient_id || !quantity || !unit || !storage_location) {
    return NextResponse.json(
      {
        error:
          "ingredient_id, quantity, unit, and storage_location are required",
      },
      { status: 400 }
    );
  }

  if (!["fridge", "freezer", "pantry"].includes(storage_location)) {
    return NextResponse.json(
      { error: "storage_location must be fridge, freezer, or pantry" },
      { status: 400 }
    );
  }

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
