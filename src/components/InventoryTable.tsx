"use client";

import type { InventoryItem } from "@/lib/types";
import { getStockStatus } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { RegionBadge } from "./RegionFilter";
import { parseArticleCode } from "@/lib/article-code";
import { formatNumber } from "@/lib/format";
import { Pencil, Trash2, ArrowLeftRight } from "lucide-react";

interface Props {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onAdjust: (item: InventoryItem) => void;
}

export function InventoryTable({ items, onEdit, onDelete, onAdjust }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
        No items match your filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Article No.</th>
              <th className="px-4 py-3">Material / Alloy</th>
              <th className="px-4 py-3">Form</th>
              <th className="px-4 py-3">Dimensions</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <RegionBadge region={item.region} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={getStockStatus(item)} />
                </td>
                <td className="px-4 py-3 font-mono font-medium text-[#396bea]">
                  {item.articleNo}
                </td>
                <td className="px-4 py-3">
                  <div>{item.material}</div>
                  <div className="text-xs text-gray-400">{item.alloy}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <div className="font-medium capitalize">{item.productForm}</div>
                  {(() => {
                    const p = parseArticleCode(item.articleNo);
                    if (!p.formCode) return null;
                    return (
                      <div className="text-xs text-gray-400">
                        {p.formCode}
                        {p.suffixCode && ` + ${p.suffixCode}`}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-gray-600">{item.dimensions}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatNumber(item.quantity)}{" "}
                  <span className="text-xs text-gray-400">{item.unit}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{item.location}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onAdjust(item)}
                      className="rounded p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-700"
                      title="Stock in / out"
                    >
                      <ArrowLeftRight size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#396bea]"
                      title="Edit item"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
