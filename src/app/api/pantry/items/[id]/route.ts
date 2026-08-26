import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/server";

// DELETE /api/pantry/items/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}

// PATCH /api/pantry/items/:id
// Body: { quantity?, unit?, storage_location?, expires_at? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  const body = await req.json();
  const { quantity, unit, storage_location, expires_at } = body;

  if (storage_location && !["fridge", "freezer", "pantry"].includes(storage_location)) {
    return NextResponse.json(
      { error: "storage_location must be fridge, freezer, or pantry" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (quantity !== undefined) updates.quantity = quantity;
  if (unit !== undefined) updates.unit = unit;
  if (storage_location !== undefined) updates.storage_location = storage_location;
  if (expires_at !== undefined) updates.expires_at = expires_at;

  const { data, error } = await supabase
    .from("pantry_items")
    .update(updates)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
