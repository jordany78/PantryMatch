"use client";

import { useState } from "react";
import { EditPantryItem } from "./edit-pantry-item";

const STORAGE_LABELS: Record<string, string> = {
  fridge: "Fridge",
  freezer: "Freezer",
  pantry: "Pantry",
};

const STORAGE_ORDER = ["fridge", "freezer", "pantry"];

interface PantryItem {
  id: string;
  quantity: number;
  unit: string;
  storage_location: "fridge" | "freezer" | "pantry";
  expires_at: string | null;
  ingredients: { name: string; category: string | null } | null;
}

export function PantryList({
  items,
  groupByStorage,
}: {
  items: PantryItem[];
  groupByStorage: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  function renderItem(item: PantryItem) {
    if (editingId === item.id) {
      return (
        <EditPantryItem
          key={item.id}
          item={item}
          onClose={() => setEditingId(null)}
        />
      );
    }

    return (
      <div
        key={item.id}
        className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.02] px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "#6fcf97", boxShadow: "0 0 6px #6fcf97" }}
          />
          <div>
            <p className="text-sm font-medium text-gray-100">
              {item.ingredients?.name ?? "Unknown ingredient"}
            </p>
            <p className="text-xs text-gray-500">
              {item.quantity} {item.unit} · {item.storage_location}
              {item.expires_at ? ` · expires ${item.expires_at}` : " · no expiry"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEditingId(item.id)}
          className="text-xs text-gray-400 hover:text-gray-200"
        >
          Edit
        </button>
      </div>
    );
  }

  if (!groupByStorage) {
    return <div className="space-y-2">{items.map(renderItem)}</div>;
  }

  return (
    <div className="space-y-6">
      {STORAGE_ORDER.map((location) => {
        const group = items.filter((i) => i.storage_location === location);
        if (group.length === 0) return null;
        return (
          <div key={location} className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-300">
              {STORAGE_LABELS[location]}
            </h2>
            {group.map(renderItem)}
          </div>
        );
      })}
    </div>
  );
}