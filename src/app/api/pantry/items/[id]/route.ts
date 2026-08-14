import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/backend/lib/supabase/admin";

// DELETE /api/pantry/items/:id?user_id=<uuid>
// TEMP: user_id comes from a query param until real auth is wired in (see
// src/app/api/pantry/items/route.ts for the same note).
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json(
      { error: "user_id query param is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("id", params.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
