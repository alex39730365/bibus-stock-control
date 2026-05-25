"use client";

import { useCallback, useEffect, useState } from "react";
import { StatsCards } from "@/components/StatsCards";
import { RegionFilter, RegionBadge, type RegionFilterValue } from "@/components/RegionFilter";
import { fetchInventory, fetchStats, getExportUrl } from "@/lib/api-client";
import type { InventoryItem, InventoryStats, Region } from "@/lib/types";
import { getStockStatus } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { REGION_META } from "@/lib/regions";

export default function DashboardPage() {
  const [region, setRegion] = useState<RegionFilterValue>("");
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [regionCounts, setRegionCounts] = useState<Partial<Record<Region, number>>>(
    {}
  );
  const [lowItems, setLowItems] = useState<InventoryItem[]>([]);

  const load = useCallback(async () => {
    const [allStatsRes, statsRes, lowRes, outRes] = await Promise.all([
      fetchStats(),
      fetchStats(region || undefined),
      fetchInventory({ status: "low", region: region || undefined }),
      fetchInventory({ status: "out", region: region || undefined }),
    ]);
    if (allStatsRes.success && allStatsRes.data) {
      setRegionCounts(allStatsRes.data.byRegion);
    }
    if (statsRes.success && statsRes.data) setStats(statsRes.data);
    const alerts = [
      ...(lowRes.data ?? []),
      ...(outRes.data ?? []),
    ].slice(0, 8);
    setLowItems(alerts);
  }, [region]);

  useEffect(() => {
    load();
  }, [load]);

  const regionLabel = region
    ? `${REGION_META[region].label} (${REGION_META[region].country})`
    : "All regions";

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Control Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            BIBUS METALS — administrator overview · {regionLabel}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={getExportUrl(region || undefined)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            <Download size={16} />
            Export Excel
          </a>
          <Link
            href="/import"
            className="flex items-center gap-2 rounded-lg bg-[#396bea] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a52b8]"
          >
            Import Excel
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <div className="mb-6">
        <RegionFilter
          value={region}
          onChange={setRegion}
          counts={regionCounts}
        />
      </div>

      {stats && <StatsCards stats={stats} />}

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Stock Alerts
          {region && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              — {regionLabel}
            </span>
          )}
        </h2>
        {lowItems.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            No low-stock or out-of-stock items for this region.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Region</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Article No.</th>
                  <th className="px-4 py-3 text-left">Material</th>
                  <th className="px-4 py-3 text-right">Qty / Min</th>
                  <th className="px-4 py-3 text-left">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <RegionBadge region={item.region} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={getStockStatus(item)} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[#396bea]">
                      {item.articleNo}
                    </td>
                    <td className="px-4 py-3">
                      {item.material} {item.alloy && `· ${item.alloy}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.quantity} / {item.minStock} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {item.location}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {stats && (
        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-800">By Region</h3>
            <ul className="space-y-2">
              {(Object.entries(stats.byRegion ?? {}) as [Region, number][]).map(
                ([r, count]) => (
                  <li key={r} className="flex items-center justify-between text-sm">
                    <RegionBadge region={r} />
                    <span className="font-medium">{count} items</span>
                  </li>
                )
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-800">By Form</h3>
            <ul className="space-y-2">
              {Object.entries(stats.byForm).map(([form, count]) => (
                <li key={form} className="flex justify-between text-sm">
                  <span className="text-gray-600">{form}</span>
                  <span className="font-medium">{count} items</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-800">Top Locations</h3>
            <ul className="space-y-2">
              {Object.entries(stats.byLocation)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([loc, count]) => (
                  <li key={loc} className="flex justify-between text-sm">
                    <span className="text-gray-600">{loc || "(unspecified)"}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
