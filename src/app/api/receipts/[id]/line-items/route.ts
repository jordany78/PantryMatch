import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/server";
import { parseJson, receiptLineItemsSchema } from "@/lib/validation";

// PATCH /api/receipts/:id/line-items
// Body: {
//   line_items: Array<{
//     id: string,              // receipt_line_items.id
//     confirmed: boolean,      // false = user rejected this item, skip it
//     ingredient_id?: string,  // override the OCR-matched ingredient if user corrected it
//     quantity?: number,
//     unit?: string,
//     storage_location?: "fridge" | "freezer" | "pantry"  // required if confirmed
//   }>
// }
//
// Confirmed items get inserted into pantry_items. Marks the receipt
// "reviewed" once processed, whether or not every item was confirmed —
// "reviewed" means the user has finished going through the checklist,
// not that every item was accepted.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const parsed = await parseJson(req, receiptLineItemsSchema);
  if (parsed instanceof NextResponse) return parsed;
  const { line_items } = parsed;

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  // Confirm the receipt belongs to this user before touching anything.
  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .select("id, user_id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (receiptError || !receipt) {
    return NextResponse.json({ error: "receipt not found" }, { status: 404 });
  }

  const insertedPantryItems = [];

  for (const item of line_items) {
    const { error: updateError } = await supabase
      .from("receipt_line_items")
      .update({
        confirmed: item.confirmed,
        matched_ingredient_id: item.ingredient_id ?? undefined,
        quantity: item.quantity ?? undefined,
        unit: item.unit ?? undefined,
      })
      .eq("id", item.id)
      .eq("receipt_id", params.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (item.confirmed) {
      const { data: pantryItem, error: pantryError } = await supabase
        .from("pantry_items")
        .insert({
          user_id: user.id,
          ingredient_id: item.ingredient_id,
          quantity: item.quantity,
          unit: item.unit,
          storage_location: item.storage_location,
          source: "receipt",
        })
        .select()
        .single();

      if (pantryError) {
        return NextResponse.json({ error: pantryError.message }, { status: 500 });
      }

      insertedPantryItems.push(pantryItem);
    }
  }

  await supabase
    .from("receipts")
    .update({ status: "reviewed" })
    .eq("id", params.id);

  return NextResponse.json({
    reviewed: true,
    pantryItemsAdded: insertedPantryItems,
  });
}
