"use client";

import type { Region } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { REGION_META, REGIONS } from "@/lib/regions";
import clsx from "clsx";

export type RegionFilterValue = Region | "";

interface Props {
  value: RegionFilterValue;
  onChange: (value: RegionFilterValue) => void;
  counts?: Partial<Record<Region, number>>;
  /** Smaller pills for panels (e.g. Top Locations) */
  compact?: boolean;
}

export function RegionFilter({ value, onChange, counts, compact }: Props) {
  const tabs: { id: RegionFilterValue; label: string; sub?: string }[] = [
    { id: "", label: "All regions" },
    ...REGIONS.map((r) => ({
      id: r as RegionFilterValue,
      label: REGION_META[r].label,
      sub: REGION_META[r].country,
    })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = value === tab.id;
        const count =
          tab.id === ""
            ? counts
              ? Object.values(counts).reduce((a, b) => a + (b ?? 0), 0)
              : undefined
            : counts?.[tab.id as Region];
        return (
          <button
            key={tab.id || "all"}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              "rounded-lg border text-left transition-colors",
              compact ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
              active
                ? "border-[#396bea] bg-[#396bea] text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <span className="font-semibold">{tab.label}</span>
            {tab.sub && (
              <span
                className={clsx(
                  "ml-1.5 text-xs",
                  active ? "text-blue-100" : "text-gray-400"
                )}
              >
                {tab.sub}
              </span>
            )}
            {count !== undefined && (
              <span
                className={clsx(
                  "ml-2 rounded-full px-2 py-0.5 text-xs font-medium",
                  active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                )}
              >
                {formatNumber(count)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function RegionBadge({ region }: { region: Region }) {
  const meta = REGION_META[region];
  return (
    <span
      className={clsx(
        "inline-flex flex-col rounded-md px-2 py-0.5 text-xs font-medium leading-tight",
        region === "BMAG"
          ? "bg-blue-50 text-[#396bea]"
          : region === "BMCN"
            ? "bg-red-50 text-red-700"
            : "bg-amber-50 text-amber-900"
      )}
    >
      <span>{meta.label}</span>
      <span className="text-[10px] font-normal opacity-80">{meta.country}</span>
    </span>
  );
}
