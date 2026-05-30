"use client";

import { useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import {
  AlertTriangle,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Truck,
} from "lucide-react";
import { EndingInventorySparkline } from "@/components/psi/EndingInventorySparkline";
import { formatNumber } from "@/lib/format";
import {
  MOS_DANGER_THRESHOLD,
  MOS_RISK_THRESHOLD,
  PSI_CURRENT_MONTH_INDEX,
  PSI_MOCK_SOURCES,
  PSI_MONTHS,
  buildPsiItems,
  formatPsiMonthLabel,
  computePsiKpis,
  formatPortfolioAvgMos,
  formatPsiValue,
  getMosTier,
  type MosTier,
  type PsiItem,
  type PsiMetricLine,
} from "@/lib/psi-mock-data";

const STICKY_Z = { head: "z-40", row: "z-30", body: "z-20" } as const;

const MONTH_COUNT = PSI_MONTHS.length;
/** Cust + Metric + month columns */
const TABLE_COL_COUNT = 2 + MONTH_COUNT;

const ITEM_HEADER_H = "h-10 max-h-10";
const DATA_ROW = "h-8 max-h-8";
const HEAD_H = "h-10 max-h-10";

/** Sticky left: Cust 64px + Metric 110px */
const COL_CUST =
  "sticky left-0 w-16 min-w-16 max-w-16 border-r border-slate-200";
const COL_METRIC =
  "sticky left-16 w-[110px] min-w-[110px] max-w-[110px] border-r border-slate-200 shadow-[4px_0_8px_-2px_rgba(15,23,42,0.06)]";

const MONTH_COL_W = "w-[3.25rem] min-w-[3.25rem] max-w-[3.25rem]";

const cellBase = "whitespace-nowrap p-0 align-middle leading-none";
const innerData = "flex h-8 max-h-8 items-center px-2 py-1";
const innerHead = "flex h-10 max-h-10 items-center px-2 py-2";

const METRICS_PER_CUST = 3;

/** Borders inside a customer bundle vs between customers. */
function customerRowBorder(metric: PsiMetricLine): string {
  if (metric === "Shortage") {
    return "border-b border-slate-200";
  }
  if (metric === "Actual") {
    return "border-b border-slate-50";
  }
  return "";
}

const MOS_DOT: Record<MosTier, string> = {
  danger: "bg-red-500",
  warning: "bg-amber-500",
  safe: "bg-emerald-500",
};

const MOS_TEXT: Record<MosTier, string> = {
  danger: "text-red-700",
  warning: "text-amber-700",
  safe: "text-emerald-700",
};

function DataCell({
  className,
  align = "left",
  children,
  stickyZ,
}: {
  className?: string;
  align?: "left" | "center" | "right";
  children: ReactNode;
  stickyZ?: string;
}) {
  return (
    <td className={clsx(cellBase, DATA_ROW, stickyZ, className)}>
      <div
        className={clsx(
          innerData,
          align === "center" && "justify-center",
          align === "right" && "justify-end"
        )}
      >
        {children}
      </div>
    </td>
  );
}

function PsiKpiCards({ items }: { items: PsiItem[] }) {
  const kpi = useMemo(() => computePsiKpis(items), [items]);
  const avgMosKpi = formatPortfolioAvgMos(kpi.avgMonthsOfSupply);

  const cards = [
    {
      label: "Total Demand",
      sub: `${formatPsiMonthLabel(PSI_CURRENT_MONTH_INDEX)} · roll-up`,
      value: formatNumber(kpi.totalDemand),
      unit: "kg",
      icon: TrendingUp,
      iconWrap: "bg-blue-50",
      iconClass: "text-[#396bea]",
    },
    {
      label: "Shortage Risk Items",
      sub: `MoS < ${MOS_RISK_THRESHOLD.toFixed(1)} months`,
      value: formatNumber(kpi.activeShortageItems),
      unit: "items",
      icon: AlertTriangle,
      iconWrap: "bg-red-50",
      iconClass: "text-red-600",
      alert: true,
    },
    {
      label: "Schedule Receipts",
      sub: "ETA this month",
      value: formatNumber(kpi.totalScheduleReceipts),
      unit: "kg",
      icon: Truck,
      iconWrap: "bg-emerald-50",
      iconClass: "text-emerald-700",
    },
    {
      label: "Avg Months of Supply",
      sub: "Portfolio average",
      value: avgMosKpi.display,
      unit: avgMosKpi.unit,
      icon: CalendarRange,
      iconWrap: avgMosKpi.alert ? "bg-amber-50" : "bg-slate-100",
      iconClass: avgMosKpi.alert ? "text-amber-600" : "text-slate-600",
      alert: avgMosKpi.alert,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(
        ({
          label,
          sub,
          value,
          unit,
          icon: Icon,
          iconWrap,
          iconClass,
          alert,
        }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className={clsx("rounded-lg p-3", iconWrap)}>
              <Icon className={iconClass} size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-500">{label}</p>
              <p
                className={clsx(
                  "text-2xl font-bold tabular-nums text-slate-900",
                  alert && "text-red-600"
                )}
              >
                {value}
                {unit != null && (
                  <span className="ml-1 text-sm font-normal text-slate-500">
                    {unit}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function MosDotValue({ value }: { value: number }) {
  if (!Number.isFinite(value)) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const tier = getMosTier(value);
  const label = formatPsiValue("Months of Supply", value, "months");

  return (
    <span className="inline-flex flex-row items-center justify-center gap-1.5 whitespace-nowrap">
      <span
        className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", MOS_DOT[tier])}
        aria-hidden
      />
      <span className={clsx("text-xs tabular-nums leading-none", MOS_TEXT[tier])}>
        {label}
      </span>
    </span>
  );
}

function MonthValueCell({
  metric,
  value,
  unit,
  className,
}: {
  metric: PsiMetricLine | "Total Demand";
  value: number | null;
  unit: string;
  className?: string;
}) {
  const isMos = metric === "Months of Supply" && value !== null;
  const numeric = value ?? 0;
  const display =
    value === null
      ? "—"
      : metric === "Total Demand"
        ? formatPsiValue("Forecast", numeric, unit)
        : formatPsiValue(metric, numeric, unit);

  const isNegativeShortage = metric === "Shortage" && numeric < 0;
  const isNegativeEnding = metric === "Ending Inventory" && numeric < 0;

  return (
    <DataCell
      align={isMos ? "center" : "right"}
      className={clsx("border-slate-100", className)}
    >
      {isMos ? (
        <MosDotValue value={numeric} />
      ) : (
        <span
          className={clsx(
            "text-xs tabular-nums leading-none",
            isNegativeShortage && "font-medium text-red-600",
            isNegativeEnding && "font-medium text-red-600",
            !isNegativeShortage && !isNegativeEnding && "text-slate-700"
          )}
        >
          {display}
        </span>
      )}
    </DataCell>
  );
}

function ItemBlock({ item }: { item: PsiItem }) {
  const [open, setOpen] = useState(item.itemCode === "I/C 905310");

  const totalMetrics = useMemo(
    (): { metric: PsiMetricLine | "Total Demand"; values: number[] }[] => [
      { metric: "Total Demand", values: item.totals.totalDemand },
      { metric: "Beginning Inventory", values: item.totals.beginningInventory },
      { metric: "Schedule Receipt (ETA)", values: item.totals.scheduleReceipt },
      { metric: "Ending Inventory", values: item.totals.endingInventory },
      { metric: "Months of Supply", values: item.totals.monthsOfSupply },
    ],
    [item.totals]
  );

  return (
    <>
      {/* Item group header — full width, no rowSpan */}
      <tr className={clsx(ITEM_HEADER_H, "border-t border-slate-200 bg-slate-50")}>
        <td colSpan={TABLE_COL_COUNT} className="p-0 align-middle">
          <div className="flex h-10 items-center gap-2 whitespace-nowrap px-3 py-1">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex shrink-0 items-center gap-1.5 rounded-md py-0.5 text-left hover:bg-slate-100"
              aria-expanded={open}
            >
              {open ? (
                <ChevronDown size={14} className="text-slate-500" />
              ) : (
                <ChevronRight size={14} className="text-slate-500" />
              )}
              <span className="font-mono text-xs font-semibold text-[#396bea]">
                {item.itemCode}
              </span>
            </button>
            <span
              className="hidden min-w-0 truncate text-xs text-slate-500 sm:inline"
              title={item.spec}
            >
              {item.spec}
            </span>
            <EndingInventorySparkline
              values={item.totals.endingInventory}
              fromMonthIndex={PSI_CURRENT_MONTH_INDEX}
            />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="ml-auto shrink-0 text-xs text-slate-400 hover:text-slate-600"
            >
              {open ? "Collapse" : "Expand"}
            </button>
          </div>
        </td>
      </tr>

      {open &&
        item.customers.map((c) => (
          <CustomerMetricRows
            key={`${item.itemCode}-${c.cust}`}
            cust={c.cust}
            forecast={c.forecast}
            actual={c.actual}
            shortage={c.shortage}
            unit={item.unit}
          />
        ))}

      {open &&
        totalMetrics.map(({ metric, values }, totalIdx) => (
          <tr
            key={`${item.itemCode}-${metric}`}
            className={clsx(
              DATA_ROW,
              "bg-blue-50/50",
              totalIdx === 0 && "border-t border-slate-200"
            )}
          >
            <DataCell
              className={clsx(COL_CUST, STICKY_Z.body, "bg-blue-50")}
              align="center"
            >
              {totalIdx === 0 ? (
                <span className="text-[10px] font-semibold uppercase leading-none text-slate-500">
                  Total
                </span>
              ) : null}
            </DataCell>
            <DataCell
              className={clsx(COL_METRIC, STICKY_Z.body, "bg-blue-50")}
            >
              <span
                className="truncate text-xs font-semibold leading-none text-[#396bea]"
                title={metric}
              >
                {metric}
              </span>
            </DataCell>
            {values.map((v, i) => (
              <MonthValueCell
                key={`${metric}-${i}`}
                metric={metric}
                value={v}
                unit={item.unit}
              />
            ))}
          </tr>
        ))}
    </>
  );
}

function CustomerMetricRows({
  cust,
  forecast,
  actual,
  shortage,
  unit,
}: {
  cust: string;
  forecast: number[];
  actual: (number | null)[];
  shortage: number[];
  unit: string;
}) {
  const rows: { metric: PsiMetricLine; values: (number | null)[] }[] = [
    { metric: "Forecast", values: forecast },
    { metric: "Actual", values: actual },
    { metric: "Shortage", values: shortage },
  ];

  return (
    <>
      {rows.map(({ metric, values }) => {
        const isForecast = metric === "Forecast";
        const rowBorder = customerRowBorder(metric);

        return (
          <tr
            key={`${cust}-${metric}`}
            className={clsx(DATA_ROW, rowBorder, "hover:bg-slate-50/80")}
          >
            {isForecast && (
              <td
                rowSpan={METRICS_PER_CUST}
                className={clsx(
                  cellBase,
                  COL_CUST,
                  STICKY_Z.body,
                  "border-b border-slate-200 bg-white align-middle"
                )}
              >
                <div className="flex items-center justify-center px-2 py-1">
                  <span className="text-xs font-semibold leading-none text-slate-700">
                    {cust}
                  </span>
                </div>
              </td>
            )}
            <DataCell
              className={clsx(COL_METRIC, STICKY_Z.body, rowBorder, "bg-white")}
            >
              <span className="text-xs leading-none text-slate-500">{metric}</span>
            </DataCell>
            {values.map((v, i) => (
              <MonthValueCell
                key={i}
                metric={metric}
                value={v}
                unit={unit}
                className={rowBorder}
              />
            ))}
          </tr>
        );
      })}
    </>
  );
}

function PsiTimelineTable({ items }: { items: PsiItem[] }) {
  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-800">
          PSI / Demantra Timeline
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Posted actual drives demand · roll-forward ending · MoS from forward
          demand average
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 table-fixed border-separate border-spacing-0 text-left text-sm">
          <colgroup>
            <col className="w-16" />
            <col className="w-[110px]" />
            {PSI_MONTHS.map((_, i) => (
              <col key={`col-m-${i}`} className="w-[3.25rem]" />
            ))}
          </colgroup>
          <thead>
            <tr className={clsx(HEAD_H, "bg-slate-50 text-slate-500")}>
              <th
                className={clsx(
                  cellBase,
                  HEAD_H,
                  COL_CUST,
                  STICKY_Z.head,
                  "border-b border-slate-200 bg-slate-50"
                )}
              >
                <div
                  className={clsx(
                    innerHead,
                    "justify-center text-[10px] font-semibold uppercase tracking-wide"
                  )}
                >
                  Cust
                </div>
              </th>
              <th
                className={clsx(
                  cellBase,
                  HEAD_H,
                  COL_METRIC,
                  STICKY_Z.head,
                  "border-b border-slate-200 bg-slate-50"
                )}
              >
                <div
                  className={clsx(
                    innerHead,
                    "text-[10px] font-semibold uppercase tracking-wide"
                  )}
                >
                  Metric
                </div>
              </th>
              {PSI_MONTHS.map((month, i) => {
                const isCurrent = i === PSI_CURRENT_MONTH_INDEX;
                return (
                  <th
                    key={`${month}-${i}`}
                    className={clsx(
                      cellBase,
                      HEAD_H,
                      MONTH_COL_W,
                      "border-b border-slate-200",
                      isCurrent ? "bg-blue-50" : "bg-slate-50"
                    )}
                  >
                    <div className={clsx(innerHead, "justify-center")}>
                      <span
                        className={clsx(
                          "text-xs font-semibold uppercase tracking-wide tabular-nums",
                          isCurrent
                            ? "border-b-2 border-blue-600 pb-0.5 font-bold text-blue-600"
                            : "text-slate-500"
                        )}
                      >
                        {month.toUpperCase()}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white">
            {items.map((item) => (
              <ItemBlock key={item.itemCode} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PsiDashboard() {
  const items = useMemo(() => buildPsiItems(PSI_MOCK_SOURCES), []);

  return (
    <div className="space-y-6">
      <PsiKpiCards items={items} />
      <PsiTimelineTable items={items} />
      <p className="text-xs text-slate-400">
        Mock data · MoS danger &lt; {MOS_DANGER_THRESHOLD} mo · target ≥
        {MOS_RISK_THRESHOLD} mo
      </p>
    </div>
  );
}
