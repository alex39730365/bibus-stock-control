"use client";

import { useState } from "react";
import type { InventoryItem, MovementType } from "@/lib/types";
import { X, ArrowDown, ArrowUp, Equal } from "lucide-react";

interface Props {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TYPES: { id: MovementType; label: string; icon: typeof ArrowUp }[] = [
  { id: "in", label: "Stock In", icon: ArrowDown },
  { id: "out", label: "Stock Out", icon: ArrowUp },
  { id: "adjust", label: "Set Quantity", icon: Equal },
];

export function StockAdjustModal({ item, open, onClose, onSuccess }: Props) {
  const [type, setType] = useState<MovementType>("in");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          type,
          quantity: Number(quantity),
          reason,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Failed");
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

  const preview =
    type === "in"
      ? item.quantity + (Number(quantity) || 0)
      : type === "out"
        ? Math.max(0, item.quantity - (Number(quantity) || 0))
        : Number(quantity) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">Stock Movement</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <p className="font-mono font-medium text-[#396bea]">{item.articleNo}</p>
            <p className="mt-1 text-gray-500">
              Current: <strong>{item.quantity}</strong> {item.unit} · {item.location}
            </p>
          </div>

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

          {quantity && (
            <p className="text-sm text-gray-600">
              After: <strong>{preview}</strong> {item.unit}
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
              {saving ? "Saving…" : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
