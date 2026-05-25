"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMovements } from "@/lib/api-client";
import type { StockMovement } from "@/lib/types";
import { RegionBadge } from "@/components/RegionFilter";
import clsx from "clsx";

const TYPE_STYLE: Record<string, string> = {
  in: "bg-green-100 text-green-800",
  out: "bg-red-100 text-red-800",
  adjust: "bg-blue-100 text-blue-800",
};

export default function MovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchMovements(200);
    if (res.success && res.data) setMovements(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
        <p className="mt-1 text-sm text-gray-500">
          Audit log of stock in, out, and quantity adjustments
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Loading…</p>
        ) : movements.length === 0 ? (
          <p className="p-8 text-center text-gray-500">
            No movements yet. Use Stock In/Out from Stock Items.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Article No.</th>
                  <th className="px-4 py-3 text-right">Before → After</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-xs font-medium uppercase",
                          TYPE_STYLE[m.type]
                        )}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RegionBadge region={m.region} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[#396bea]">
                      {m.articleNo}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.quantityBefore} → <strong>{m.quantityAfter}</strong>{" "}
                      <span className="text-gray-400">{m.unit}</span>
                      <span
                        className={clsx(
                          "ml-1 text-xs",
                          m.delta >= 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        ({m.delta >= 0 ? "+" : ""}
                        {m.delta})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                      {m.reason}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{m.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
