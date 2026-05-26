"use client";

import { useCallback, useEffect, useState } from "react";
import { cancelMovement, fetchMovements } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import type { StockMovement } from "@/lib/types";
import { RegionBadge } from "@/components/RegionFilter";
import clsx from "clsx";
import { Undo2 } from "lucide-react";

const TYPE_STYLE: Record<string, string> = {
  in: "bg-green-100 text-green-800",
  out: "bg-red-100 text-red-800",
  adjust: "bg-blue-100 text-blue-800",
};

export default function MovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchMovements(200);
    if (res.success && res.data) setMovements(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (m: StockMovement) => {
    if (m.cancelledAt) return;
    if (
      !confirm(
        `Cancel this ${m.type} movement?\n\nStock will return to ${m.quantityBefore} ${m.unit} (from ${m.quantityAfter} ${m.unit}).`
      )
    ) {
      return;
    }

    setCancellingId(m.id);
    setError(null);
    const res = await cancelMovement(m.id);
    setCancellingId(null);

    if (!res.success) {
      setError(res.error ?? "Cancel failed");
      return;
    }
    await load();
  };

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
        <p className="mt-1 text-sm text-gray-500">
          Audit log of stock in, out, and adjustments. Cancel restores stock to
          the quantity before that entry (if stock has not changed since).
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Loading…</p>
        ) : movements.length === 0 ? (
          <p className="p-8 text-center text-gray-500">
            No movements yet. Use Stock In/Out from Stock Items.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Article No.</th>
                  <th className="px-4 py-3 text-right">Before → After</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="sticky right-0 z-10 bg-gray-50 px-4 py-3 text-right shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((m) => {
                  const cancelled = Boolean(m.cancelledAt);
                  return (
                    <tr
                      key={m.id}
                      className={clsx(
                        "hover:bg-gray-50",
                        cancelled && "bg-gray-50/80 opacity-70"
                      )}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {formatDateTime(m.createdAt)}
                        {cancelled && m.cancelledAt && (
                          <div className="mt-0.5 text-xs text-gray-400">
                            Cancelled {formatDateTime(m.cancelledAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={clsx(
                            "rounded-full px-2 py-0.5 text-xs font-medium uppercase",
                            cancelled
                              ? "bg-gray-200 text-gray-600 line-through"
                              : TYPE_STYLE[m.type]
                          )}
                        >
                          {m.type}
                        </span>
                        {cancelled && (
                          <span className="ml-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <RegionBadge region={m.region} />
                      </td>
                      <td className="px-4 py-3 font-mono text-[#396bea]">
                        {m.articleNo}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {m.quantityBefore} →{" "}
                        <strong
                          className={clsx(cancelled && "line-through")}
                        >
                          {m.quantityAfter}
                        </strong>{" "}
                        <span className="text-gray-400">{m.unit}</span>
                        {!cancelled && (
                          <span
                            className={clsx(
                              "ml-1 text-xs",
                              m.delta >= 0 ? "text-green-600" : "text-red-600"
                            )}
                          >
                            ({m.delta >= 0 ? "+" : ""}
                            {m.delta})
                          </span>
                        )}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-gray-600">
                        {m.reason}
                        {cancelled && m.cancelledBy && (
                          <span className="block text-xs text-gray-400">
                            by {m.cancelledBy}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{m.operator}</td>
                      <td
                        className={clsx(
                          "sticky right-0 z-10 px-4 py-3 text-right shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]",
                          cancelled ? "bg-gray-50/80" : "bg-white"
                        )}
                      >
                        {!cancelled ? (
                          <button
                            type="button"
                            onClick={() => handleCancel(m)}
                            disabled={cancellingId === m.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                            title="Cancel movement and restore previous quantity"
                          >
                            <Undo2 size={14} />
                            {cancellingId === m.id ? "Cancelling…" : "Cancel"}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
