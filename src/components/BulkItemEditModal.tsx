"use client";

import { useState } from "react";
import type { InventoryItem, Region } from "@/lib/types";
import { REGIONS, REGION_META } from "@/lib/regions";
import { formatNumber } from "@/lib/format";
import { SelectedItemsList } from "./SelectedItemsList";
import { X } from "lucide-react";

interface Props {
  items: InventoryItem[];
  open: boolean;
  onClose: () => void;
  onSave: (
    patch: Partial<Omit<InventoryItem, "id" | "updatedAt">>
  ) => Promise<void>;
}

export function BulkItemEditModal({ items, open, onClose, onSave }: Props) {
  const [region, setRegion] = useState<Region | "">("");
  const [location, setLocation] = useState("");
  const [minStock, setMinStock] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || items.length === 0) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const patch: Partial<Omit<InventoryItem, "id" | "updatedAt">> = {};
    if (region) patch.region = region;
    if (location.trim()) patch.location = location.trim();
    if (minStock !== "") patch.minStock = Number(minStock);
    if (supplier.trim()) patch.supplier = supplier.trim();
    if (notes.trim()) patch.notes = notes.trim();

    if (Object.keys(patch).length === 0) {
      setError("Fill at least one field to update.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(patch);
      setRegion("");
      setLocation("");
      setMinStock("");
      setSupplier("");
      setNotes("");
      onClose();
    } catch {
      setError("Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">Edit items</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <p className="text-sm text-gray-500">
            Only filled fields are applied to all selected items. Article details
            are unchanged.
          </p>
          <SelectedItemsList items={items} />

          <label className="block text-sm">
            <span className="font-medium text-gray-700">Region</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as Region | "")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">— no change —</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {REGION_META[r].label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="font-medium text-gray-700">Location</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Leave empty to keep current"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-gray-700">Min stock</span>
            <input
              type="number"
              min={0}
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              placeholder="Leave empty to keep current"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-gray-700">Supplier</span>
            <input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Leave empty to keep current"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-gray-700">Notes</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Leave empty to keep current"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#396bea] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a52b8] disabled:opacity-50"
            >
              {saving ? "Saving…" : `Apply to ${formatNumber(items.length)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
