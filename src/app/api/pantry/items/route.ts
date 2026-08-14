import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/backend/lib/supabase/admin";

// GET /api/pantry/items?user_id=<uuid>
// TEMP: user_id comes from a query param until real auth is wired in.
// Once Supabase Auth is on the frontend, read the user from the session
// (src/lib/supabase/server.ts) instead of trusting a query param.
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json(
      { error: "user_id query param is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pantry_items")
    .select("*, ingredients(name, category)")
    .eq("user_id", userId)
    .order("purchase_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}

// POST /api/pantry/items
// Body: { user_id, ingredient_id, quantity, unit, storage_location, expires_at? }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user_id, ingredient_id, quantity, unit, storage_location, expires_at } =
    body;

  if (!user_id || !ingredient_id || !quantity || !unit || !storage_location) {
    return NextResponse.json(
      {
        error:
          "user_id, ingredient_id, quantity, unit, and storage_location are required",
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

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pantry_items")
    .insert({
      user_id,
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
