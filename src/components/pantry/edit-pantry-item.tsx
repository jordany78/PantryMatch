"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_OPTIONS = ["fridge", "freezer", "pantry"] as const;

interface PantryItemData {
  id: string;
  quantity: number;
  unit: string;
  storage_location: (typeof STORAGE_OPTIONS)[number];
  expires_at: string | null;
  ingredients: { name: string; category: string | null } | null;
}

export function EditPantryItem({
  item,
  onClose,
}: {
  item: PantryItemData;
  onClose: () => void;
}) {
  const router = useRouter();

  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unit, setUnit] = useState(item.unit);
  const [storageLocation, setStorageLocation] = useState(item.storage_location);
  const [expiresAt, setExpiresAt] = useState(item.expires_at ?? "");
  const [noExpiry, setNoExpiry] = useState(!item.expires_at);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/pantry/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(quantity),
          unit,
          storage_location: storageLocation,
          expires_at: noExpiry ? null : expiresAt || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update item");
      }
      onClose();
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/pantry/items/${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to remove item");
      }
      onClose();
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
      setDeleting(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-3 rounded-md border border-white/10 bg-white/[0.02] p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-100">
          Editing: <span style={{ color: "#6fcf97" }}>{item.ingredients?.name}</span>
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          Cancel
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
            Doesn&apos;t expire
          </label>
        </div>
      </div>

      {formError && <p className="text-xs text-red-400">{formError}</p>}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting || submitting}
          className="text-xs text-red-400 hover:underline disabled:opacity-50"
        >
          {deleting ? "Removing..." : "Remove item"}
        </button>

        <button
          type="submit"
          disabled={submitting || deleting}
          className="rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: "#6fcf97", color: "#0d0f0d" }}
        >
          {submitting ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}