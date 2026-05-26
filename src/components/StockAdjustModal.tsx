"use client";

import { useEffect, useState } from "react";
import type { InventoryItem, MovementType } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { SelectedItemsList } from "./SelectedItemsList";
import { X, ArrowDown, ArrowUp, Equal } from "lucide-react";

interface Props {
  items: InventoryItem[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TYPES: { id: MovementType; label: string; icon: typeof ArrowUp }[] = [
  { id: "in", label: "Stock In", icon: ArrowDown },
  { id: "out", label: "Stock Out", icon: ArrowUp },
  { id: "adjust", label: "Set Quantity", icon: Equal },
];

function previewQty(item: InventoryItem, type: MovementType, qty: number): number {
  if (type === "in") return item.quantity + qty;
  if (type === "out") return Math.max(0, item.quantity - qty);
  return qty;
}

export function StockAdjustModal({ items, open, onClose, onSuccess }: Props) {
  const [type, setType] = useState<MovementType>("in");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulk = items.length > 1;
  const single = items[0];

  useEffect(() => {
    if (open) {
      setQuantity("");
      setReason("");
      setError(null);
      setType("in");
    }
  }, [open, items]);

  if (!open || items.length === 0) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const qty = Number(quantity);
    const failed: string[] = [];

    try {
      for (const item of items) {
        const res = await fetch("/api/movements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: item.id,
            type,
            quantity: qty,
            reason,
          }),
        });
        const data = await res.json();
        if (!data.success) failed.push(item.articleNo);
      }

      if (failed.length > 0) {
        setError(
          `Failed for ${formatNumber(failed.length)} item(s): ${failed.slice(0, 5).join(", ")}${failed.length > 5 ? "…" : ""}`
        );
        if (failed.length < items.length) {
          onSuccess();
        }
        return;
      }

      setQuantity("");
      setReason("");
      onSuccess();
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const qtyNum = Number(quantity) || 0;
  const preview = !bulk && single && quantity ? previewQty(single, type, qtyNum) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">
            {bulk
              ? `Stock movement (${formatNumber(items.length)} items)`
              : "Stock Movement"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {bulk ? (
            <>
              <p className="text-sm text-gray-600">
                The same movement is applied to every item listed below.
              </p>
              <SelectedItemsList items={items} />
            </>
          ) : (
            single && <SelectedItemsList items={[single]} />
          )}

          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setType(id)}
                className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs font-medium ${
                  type === id
                    ? "border-[#396bea] bg-blue-50 text-[#396bea]"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>

          <label className="block text-sm">
            <span className="font-medium text-gray-700">
              {type === "adjust" ? "New quantity" : "Quantity"}
              {bulk && " (each item)"}
            </span>
            <input
              type="number"
              min={0}
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>

          {preview !== null && single && (
            <p className="text-sm text-gray-600">
              After: <strong>{preview}</strong> {single.unit}
            </p>
          )}

          <label className="block text-sm">
            <span className="font-medium text-gray-700">Reason / reference</span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="PO number, customer, adjustment note…"
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
              {saving
                ? "Saving…"
                : bulk
                  ? `Apply to ${formatNumber(items.length)}`
                  : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
