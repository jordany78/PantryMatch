"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface LocalIngredient {
  id: string;
  name: string;
  category: string | null;
}

interface SpoonacularResult {
  id: number;
  name: string;
  image: string;
}

interface SelectedIngredient {
  id: string;
  name: string;
}

const STORAGE_OPTIONS = ["fridge", "freezer", "pantry"] as const;

export function AddPantryItem() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [localResults, setLocalResults] = useState<LocalIngredient[]>([]);
  const [spoonacularResults, setSpoonacularResults] = useState<SpoonacularResult[]>([]);
  const [searchingSpoonacular, setSearchingSpoonacular] = useState(false);
  const [selected, setSelected] = useState<SelectedIngredient | null>(null);

  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [storageLocation, setStorageLocation] =
    useState<(typeof STORAGE_OPTIONS)[number]>("pantry");
  const [expiresAt, setExpiresAt] = useState("");
  const [noExpiry, setNoExpiry] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Debounced local search as the user types — no Spoonacular cost here.
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setLocalResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/ingredients/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setLocalResults(data.ingredients ?? []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  function selectLocal(ingredient: LocalIngredient) {
    setSelected({ id: ingredient.id, name: ingredient.name });
    setSpoonacularResults([]);
  }

  async function searchSpoonacular() {
    if (!query || query.trim().length < 2) return;
    setSearchingSpoonacular(true);
    try {
      const res = await fetch(
        `/api/ingredients/spoonacular-search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setSpoonacularResults(data.results ?? []);
    } finally {
      setSearchingSpoonacular(false);
    }
  }

  async function selectSpoonacular(result: SpoonacularResult) {
    const res = await fetch("/api/ingredients/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spoonacularId: result.id, name: result.name }),
    });
    const data = await res.json();
    if (data.ingredient) {
      setSelected({ id: data.ingredient.id, name: data.ingredient.name });
      setSpoonacularResults([]);
    }
  }

  function reset() {
    setQuery("");
    setLocalResults([]);
    setSpoonacularResults([]);
    setSelected(null);
    setQuantity("");
    setUnit("");
    setStorageLocation("pantry");
    setExpiresAt("");
    setNoExpiry(false);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !quantity || !unit) {
      setFormError("Please fill in quantity and unit.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/pantry/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredient_id: selected.id,
          quantity: Number(quantity),
          unit,
          storage_location: storageLocation,
          expires_at: noExpiry ? null : expiresAt || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add item");
      }
      reset();
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-4">
      {!selected ? (
        <div className="space-y-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for an ingredient..."
            className="w-full rounded-md border border-white/10 bg-[#0d0f0d] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-[#6fcf97] focus:outline-none"
          />

          {localResults.length > 0 && (
            <ul className="space-y-1">
              {localResults.map((ing) => (
                <li key={ing.id}>
                  <button
                    type="button"
                    onClick={() => selectLocal(ing)}
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/5"
                  >
                    {ing.name}
                    {ing.category && (
                      <span className="ml-2 text-xs text-gray-500">{ing.category}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim().length >= 2 && (
            <button
              type="button"
              onClick={searchSpoonacular}
              disabled={searchingSpoonacular}
              className="text-xs text-[#6fcf97] hover:underline disabled:opacity-50"
            >
              {searchingSpoonacular
                ? "Searching..."
                : localResults.length > 0
                ? "Not what you're looking for? Search more"
                : "Search more ingredients"}
            </button>
          )}

          {spoonacularResults.length > 0 && (
            <ul className="space-y-1 border-t border-white/10 pt-2">
              {spoonacularResults.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => selectSpoonacular(r)}
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/5"
                  >
                    {r.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-100">
              Adding: <span style={{ color: "#6fcf97" }}>{selected.name}</span>
            </p>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Change
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Quantity"
              className="rounded-md border border-white/10 bg-[#0d0f0d] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-[#6fcf97] focus:outline-none"
            />
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unit (e.g. g, cups)"
              className="rounded-md border border-white/10 bg-[#0d0f0d] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-[#6fcf97] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={storageLocation}
              onChange={(e) =>
                setStorageLocation(e.target.value as (typeof STORAGE_OPTIONS)[number])
              }
              className="rounded-md border border-white/10 bg-[#0d0f0d] px-3 py-2 text-sm text-gray-100 focus:border-[#6fcf97] focus:outline-none"
            >
              {STORAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>

            <div className="space-y-1">
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                disabled={noExpiry}
                className="w-full rounded-md border border-white/10 bg-[#0d0f0d] px-3 py-2 text-sm text-gray-100 focus:border-[#6fcf97] focus:outline-none disabled:opacity-40"
              />
              <label className="flex items-center gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={noExpiry}
                  onChange={(e) => {
                    setNoExpiry(e.target.checked);
                    if (e.target.checked) setExpiresAt("");
                  }}
                  className="rounded border-white/20 bg-[#0d0f0d]"
                />
                Doesn&apos;t expire (salt, spices, etc.)
              </label>
            </div>
          </div>

          {formError && <p className="text-xs text-red-400">{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#6fcf97", color: "#0d0f0d" }}
          >
            {submitting ? "Adding..." : "Add to pantry"}
          </button>
        </form>
      )}
    </div>
  );
}