"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StatsCards } from "@/components/StatsCards";
import { RegionFilter, RegionBadge, type RegionFilterValue } from "@/components/RegionFilter";
import { Pagination } from "@/components/Pagination";
import { fetchInventory, fetchStats, getExportUrl } from "@/lib/api-client";
import type { InventoryItem, InventoryStats, Region, StockStatus } from "@/lib/types";
import { getStockStatus } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { REGION_META } from "@/lib/regions";

const ALERTS_PAGE_SIZE = 10;

type AlertStatusFilter = "alert" | StockStatus;

const ALERT_TABS: { id: AlertStatusFilter; label: string }[] = [
  { id: "alert", label: "All alerts" },
  { id: "low", label: "Low stock" },
  { id: "out", label: "Out of stock" },
];

export default function DashboardPage() {
  const [region, setRegion] = useState<RegionFilterValue>("");
  const [alertStatus, setAlertStatus] = useState<AlertStatusFilter>("alert");
  const [alertPage, setAlertPage] = useState(1);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [regionCounts, setRegionCounts] = useState<Partial<Record<Region, number>>>(
    {}
  );
  const [alertItems, setAlertItems] = useState<InventoryItem[]>([]);
  const [alertTotal, setAlertTotal] = useState(0);
  const [alertTotalPages, setAlertTotalPages] = useState(1);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [locationsRegion, setLocationsRegion] = useState<RegionFilterValue>("");
  const [locationsStats, setLocationsStats] = useState<InventoryStats | null>(null);
  const alertsSectionRef = useRef<HTMLElement>(null);
  const scrollLockY = useRef<number | null>(null);

  const load = useCallback(async () => {
    setAlertsLoading(true);
    const [allStatsRes, statsRes, alertsRes] = await Promise.all([
      fetchStats(),
      fetchStats(region || undefined),
      fetchInventory({
        status: alertStatus,
        region: region || undefined,
        page: alertPage,
        limit: ALERTS_PAGE_SIZE,
      }),
    ]);
    if (allStatsRes.success && allStatsRes.data) {
      setRegionCounts(allStatsRes.data.byRegion);
    }
    if (statsRes.success && statsRes.data) setStats(statsRes.data);
    if (alertsRes.success && alertsRes.data) {
      setAlertItems(alertsRes.data);
      setAlertTotal(alertsRes.meta?.total ?? alertsRes.data.length);
      setAlertTotalPages(alertsRes.meta?.totalPages ?? 1);
    }
    setAlertsLoading(false);
  }, [region, alertStatus, alertPage]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      const res = await fetchStats(locationsRegion || undefined);
      if (res.success && res.data) setLocationsStats(res.data);
    })();
  }, [locationsRegion]);

  useEffect(() => {
    if (!alertsLoading && scrollLockY.current !== null) {
      window.scrollTo({ top: scrollLockY.current, left: 0, behavior: "instant" });
      scrollLockY.current = null;
    }
  }, [alertsLoading, alertItems]);

  const onRegionChange = (value: RegionFilterValue) => {
    setRegion(value);
    setAlertPage(1);
  };

  const onAlertStatusChange = (value: AlertStatusFilter) => {
    setAlertStatus(value);
    setAlertPage(1);
  };

  const onAlertPageChange = (page: number) => {
    scrollLockY.current = window.scrollY;
    setAlertPage(page);
  };

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
          onChange={onRegionChange}
          counts={regionCounts}
        />
      </div>

      {stats && <StatsCards stats={stats} />}

      <section ref={alertsSectionRef} className="mt-8 scroll-mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Stock Alerts
            {region && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                — {regionLabel}
              </span>
            )}
          </h2>
          <div className="flex flex-wrap gap-2">
            {ALERT_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onAlertStatusChange(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  alertStatus === tab.id
                    ? "bg-[#396bea] text-white"
                    : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {alertItems.length === 0 && !alertsLoading ? (
          <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            No items match this alert filter for the selected region.
          </p>
        ) : (
          <div className="relative min-h-[280px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {alertsLoading && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm text-gray-500"
                aria-busy="true"
              >
                Loading…
              </div>
            )}
            <table
              className={`w-full text-sm transition-opacity ${alertsLoading ? "opacity-60" : ""}`}
            >
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
                {alertItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <RegionBadge region={item.region} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={getStockStatus(item)} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[#396bea]">
                      <Link
                        href={`/inventory?search=${encodeURIComponent(item.articleNo)}`}
                        className="hover:underline"
                      >
                        {item.articleNo}
                      </Link>
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
            {alertTotalPages > 1 && (
              <Pagination
                page={alertPage}
                totalPages={alertTotalPages}
                total={alertTotal}
                onPageChange={onAlertPageChange}
              />
            )}
          </div>
        )}
        {!alertsLoading && alertTotal > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            {alertTotalPages > 1
              ? `Page ${alertPage} of ${alertTotalPages} · ${formatNumber(alertTotal)} alerts`
              : `${formatNumber(alertTotal)} alert${alertTotal === 1 ? "" : "s"}`}
          </p>
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
            <div className="mb-3 flex flex-col gap-3">
              <h3 className="font-semibold text-gray-800">Top Locations</h3>
              <p className="text-xs text-gray-500">By subsidiary branch</p>
              <RegionFilter
                compact
                value={locationsRegion}
                onChange={setLocationsRegion}
                counts={stats.byRegion}
              />
            </div>
            <ul className="space-y-2">
              {Object.entries(locationsStats?.byLocation ?? stats.byLocation)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([loc, count]) => (
                  <li key={loc} className="flex justify-between text-sm">
                    <span className="text-gray-600">{loc || "(unspecified)"}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
            </ul>
            {locationsRegion && (
              <p className="mt-3 text-xs text-gray-400">
                {REGION_META[locationsRegion].label} — {REGION_META[locationsRegion].country}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
