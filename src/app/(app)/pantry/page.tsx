import { getAuthenticatedClient } from "@/lib/supabase/server";
import { AddPantryItem } from "@/components/pantry/add-pantry-item";
import { PantryList } from "@/components/pantry/pantry-list";
import Link from "next/link";

type SortOption = "expiry" | "name" | "storage" | "recent";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Recently added" },
  { value: "expiry", label: "Expiring soon" },
  { value: "name", label: "Name" },
  { value: "storage", label: "Storage" },
];

export default async function PantryPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  const { supabase } = await getAuthenticatedClient();

  const sort = (searchParams.sort as SortOption) ?? "recent";

  let query = supabase.from("pantry_items").select("*, ingredients(name, category)");

  switch (sort) {
    case "expiry":
      // Items with no expiry (null) go last, not first
      query = query.order("expires_at", { ascending: true, nullsFirst: false });
      break;
    case "name":
      query = query.order("ingredients(name)", { ascending: true });
      break;
    case "storage":
      query = query.order("storage_location", { ascending: true });
      break;
    default:
      query = query.order("purchase_date", { ascending: false });
  }

  const { data: items, error } = await query;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-100">Pantry</h1>
        <p className="text-sm text-gray-400">
          Everything currently in your fridge, freezer, and pantry.
        </p>
      </div>

      <AddPantryItem />

      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <span className="text-xs text-gray-500">Sort by:</span>
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/pantry?sort=${opt.value}`}
            className="rounded-md px-3 py-1 text-xs"
            style={{
              color: sort === opt.value ? "#6fcf97" : "#9ca3af",
              backgroundColor:
                sort === opt.value ? "rgba(111, 207, 151, 0.1)" : "transparent",
            }}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {error && (
          <p className="text-sm text-red-400">
            Couldn&apos;t load your pantry items right now.
          </p>
        )}

        {items && items.length === 0 && (
          <p className="text-sm text-gray-500">
            Nothing here yet: add your first item above.
          </p>
        )}

        {items && items.length > 0 && (
          <PantryList items={items} groupByStorage={sort === "storage"} />
        )}
      </div>
    </div>
  );
}