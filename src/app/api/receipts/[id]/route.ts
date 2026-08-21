import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/server";

// GET /api/receipts/:id
// Returns receipt status and its parsed line items (populated once OCR
// completes in POST /api/receipts).
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (receiptError || !receipt) {
    return NextResponse.json({ error: "receipt not found" }, { status: 404 });
  }

  const { data: lineItems, error: lineItemsError } = await supabase
    .from("receipt_line_items")
    .select("*, ingredients(name, category)")
    .eq("receipt_id", params.id);

  if (lineItemsError) {
    return NextResponse.json({ error: lineItemsError.message }, { status: 500 });
  }

  return NextResponse.json({ receipt, lineItems });
}
