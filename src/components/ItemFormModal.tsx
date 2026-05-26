"use client";

import { useEffect, useState } from "react";
import type { InventoryItem, ProductForm, Region } from "@/lib/types";
import { PRODUCT_FORMS, defaultUnitForForm } from "@/lib/types";
import { REGIONS, REGION_META } from "@/lib/regions";
import { SelectedItemsList } from "./SelectedItemsList";
import { X } from "lucide-react";

const empty: Omit<InventoryItem, "id" | "updatedAt"> = {
  region: "BMAG",
  articleNo: "",
  material: "",
  alloy: "",
  productForm: "bar",
  dimensions: "",
  quantity: 0,
  unit: "kg",
  location: "",
  minStock: 0,
  supplier: "BIBUS METALS AG",
  notes: "",
};

interface Props {
  item?: InventoryItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<InventoryItem, "id" | "updatedAt">) => Promise<void>;
}

export function ItemFormModal({ item, open, onClose, onSave }: Props) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      const { id: _id, updatedAt: _updatedAt, ...rest } = item;
      void _id;
      void _updatedAt;
      setForm(rest);
    } else {
      setForm(empty);
    }
  }, [item, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    key: keyof typeof form,
    type = "text"
  ) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">
        {label}
      </span>
      {key === "region" ? (
        <select
          value={form.region}
          onChange={(e) =>
            setForm({ ...form, region: e.target.value as Region })
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#396bea] focus:outline-none focus:ring-1 focus:ring-[#396bea]"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {REGION_META[r].label} — {REGION_META[r].country}
            </option>
          ))}
        </select>
      ) : key === "productForm" ? (
        <select
          value={form.productForm}
          onChange={(e) => {
            const productForm = e.target.value as ProductForm;
            setForm({
              ...form,
              productForm,
              unit: defaultUnitForForm(productForm),
            });
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#396bea] focus:outline-none focus:ring-1 focus:ring-[#396bea]"
        >
          {PRODUCT_FORMS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={String(form[key as keyof typeof form] ?? "")}
          onChange={(e) =>
            setForm({
              ...form,
              [key]:
                type === "number" ? Number(e.target.value) : e.target.value,
            })
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#396bea] focus:outline-none focus:ring-1 focus:ring-[#396bea]"
        />
      )}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold">
            {item ? "Edit Item" : "Add Item"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 p-5">
          {item && (
            <div className="col-span-2">
              <SelectedItemsList items={[item]} />
            </div>
          )}
          {field("Region", "region")}
          <div className="col-span-2">{field("Article No. *", "articleNo")}</div>
          {field("Material", "material")}
          {field("Alloy", "alloy")}
          {field("Form", "productForm")}
          <div className="col-span-2">{field("Dimensions", "dimensions")}</div>
          {field("Quantity", "quantity", "number")}
          {field("Unit", "unit")}
          {field("Location", "location")}
          {field("Min Stock", "minStock", "number")}
          <div className="col-span-2">{field("Supplier", "supplier")}</div>
          <div className="col-span-2">{field("Notes", "notes")}</div>
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.articleNo}
              className="rounded-lg bg-[#396bea] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a52b8] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
