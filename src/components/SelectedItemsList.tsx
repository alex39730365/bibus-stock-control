import type { InventoryItem } from "@/lib/types";
import { formatNumber } from "@/lib/format";

export function SelectedItemsList({ items }: { items: InventoryItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Selected items ({formatNumber(items.length)})
      </p>
      <ul className="mt-2 max-h-52 space-y-2 overflow-y-auto pr-1 text-sm">
        {items.map((i) => (
          <li
            key={i.id}
            className="rounded-md border border-gray-100 bg-white px-2.5 py-2"
          >
            <p className="font-mono font-medium text-[#396bea]">{i.articleNo}</p>
            {(i.material || i.alloy) && (
              <p className="mt-0.5 text-gray-700">
                {[i.material, i.alloy].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="mt-0.5 text-xs text-gray-500">
              {formatNumber(i.quantity)} {i.unit}
              {i.location ? ` · ${i.location}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
