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
const STICKY_COL_COUNT = 2;
/** Sticky cols fixed (px); month cols share remaining width when table is w-full. */
const CUST_COL_PX = 64;
const METRIC_COL_PX = 110;
const MONTH_COL_MIN_PX = 52;
const STICKY_BLOCK_PX = CUST_COL_PX + METRIC_COL_PX;
const TABLE_MIN_WIDTH_PX = STICKY_BLOCK_PX + MONTH_COUNT * MONTH_COL_MIN_PX;
/** Even split of leftover table width — keeps APR…MAY grid aligned under w-full. */
const MONTH_COL_WIDTH = `calc((100% - ${STICKY_BLOCK_PX}px) / ${MONTH_COUNT})`;

/** CUST + METRIC + PSI_MONTHS — must match <colgroup> column count. */
function getTableColSpan(): number {
  return STICKY_COL_COUNT + PSI_MONTHS.length;
}

const ITEM_HEADER_H = "h-10 max-h-10";
const DATA_ROW = "h-8 max-h-8";
const HEAD_H = "h-10 max-h-10";

/** Width from <col> only — no w-* on cells (prevents thead/tbody drift). */
const COL_CUST = "sticky left-0 box-border border-r border-slate-200 bg-inherit";
const COL_METRIC = "sticky left-[64px] box-border border-r border-slate-200 bg-inherit";
const MONTH_CELL =
  "box-border overflow-hidden border-r border-slate-100 p-0 align-middle";

const cellBase = "whitespace-nowrap p-0 align-middle leading-none";
const innerData = "flex h-8 max-h-8 w-full items-center px-2 py-1";
const innerHead = "flex h-10 max-h-10 w-full items-center px-2 py-2";
const innerMonthHead =
  "flex h-10 max-h-10 w-full items-center justify-center px-1";
const innerMonthData =
  "flex h-8 max-h-8 w-full items-center justify-center px-1 tabular-nums";

/** Total summary: merged CUST+METRIC (colSpan 2). */
const TOTAL_LABEL_COL = clsx(
  cellBase,
  DATA_ROW,
  "sticky left-0 z-20 box-border border-r border-slate-200 bg-inherit"
);

const METRICS_PER_CUST = 3;

/** Subtle fill for roll-up rows (distinct from buyer detail rows). */
const TOTAL_ROW_BG = "bg-slate-50";

/** Buyer group end — must match on rowSpan CUST + every Shortage data cell. */
const CUST_GROUP_END_BORDER = "border-b border-solid border-slate-300";
/** Forecast / Actual interior dividers (data cells only). */
const CUST_INNER_ROW_BORDER = "border-b border-solid border-slate-100";

/** Per-cell bottom border for buyer metric rows (never on `<tr>` — rowSpan eats tr borders). */
function customerDataCellBorder(metric: PsiMetricLine): string {
  return metric === "Shortage" ? CUST_GROUP_END_BORDER : CUST_INNER_ROW_BORDER;
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
    <span className="inline-flex w-full flex-row items-center justify-center gap-1.5 whitespace-nowrap">
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

/** Read series at month index; always returns a slot (never skip columns). */
function valueAtMonthIndex(
  values: readonly (number | null)[],
  monthIndex: number
): number | null {
  if (monthIndex < 0 || monthIndex >= MONTH_COUNT) return null;
  const v = values[monthIndex];
  if (v === undefined || v === null) return null;
  if (typeof v === "number" && !Number.isFinite(v)) return null;
  return v;
}

/** One `<td>` per `PSI_MONTHS` entry — same order as `<thead>`. */
function MonthColumns({
  metric,
  unit,
  values,
  className,
}: {
  metric: PsiMetricLine | "Total Demand";
  unit: string;
  values: readonly (number | null)[];
  className?: string;
}) {
  return (
    <>
      {PSI_MONTHS.map((month, monthIndex) => (
        <MonthValueCell
          key={`${month}-${monthIndex}`}
          monthIndex={monthIndex}
          metric={metric}
          value={valueAtMonthIndex(values, monthIndex)}
          unit={unit}
          className={className}
        />
      ))}
    </>
  );
}

function MonthValueCell({
  metric,
  value,
  unit,
  monthIndex,
  className,
}: {
  metric: PsiMetricLine | "Total Demand";
  value: number | null;
  unit: string;
  monthIndex: number;
  className?: string;
}) {
  const isCurrentMonth = monthIndex === PSI_CURRENT_MONTH_INDEX;
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

  const isLastMonth = monthIndex === MONTH_COUNT - 1;

  return (
    <td
      className={clsx(
        cellBase,
        DATA_ROW,
        MONTH_CELL,
        isLastMonth && "border-r-0",
        isCurrentMonth && "bg-blue-50",
        className
      )}
    >
      <div className={innerMonthData}>
        {isMos ? (
          <MosDotValue value={numeric} />
        ) : (
          <span
            className={clsx(
              "text-xs leading-none",
              isNegativeShortage && "font-medium text-red-600",
              isNegativeEnding && "font-medium text-red-600",
              !isNegativeShortage && !isNegativeEnding && "text-slate-700"
            )}
          >
            {display}
          </span>
        )}
      </div>
    </td>
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
      {/* Item group header — spans every column (CUST + METRIC + all months) */}
      <tr className={clsx(ITEM_HEADER_H, "border-t border-slate-200 bg-slate-50/75")}>
        <td
          colSpan={getTableColSpan()}
          className="w-full bg-slate-50/75 p-0 align-middle"
        >
          <div className="flex h-10 w-full min-w-full items-center justify-between gap-3 whitespace-nowrap px-4 py-2">
            <div className="flex min-w-0 items-center gap-3">
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
            </div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="shrink-0 text-xs text-slate-400 hover:text-slate-600"
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
        totalMetrics.map(({ metric, values }, totalIdx) => {
          const isFirstTotal = totalIdx === 0;
          const isLastTotal = totalIdx === totalMetrics.length - 1;
          const totalCellBorder = clsx(
            isFirstTotal && "border-t border-solid border-slate-200",
            isLastTotal && "border-b border-solid border-slate-200"
          );

          return (
            <tr
              key={`${item.itemCode}-${metric}`}
              className={clsx(DATA_ROW, TOTAL_ROW_BG)}
            >
              {/* CUST + METRIC — colSpan 2 matches sticky pair width; frees month grid alignment */}
              <td
                colSpan={STICKY_COL_COUNT}
                className={clsx(
                  TOTAL_LABEL_COL,
                  TOTAL_ROW_BG,
                  totalCellBorder,
                  "align-middle"
                )}
              >
                <div
                  className="flex h-8 w-full items-center gap-0"
                  style={{ width: STICKY_BLOCK_PX, minWidth: STICKY_BLOCK_PX }}
                >
                  <div
                    className="flex shrink-0 items-center justify-center px-1"
                    style={{ width: CUST_COL_PX }}
                  >
                    {isFirstTotal ? (
                      <span className="text-[10px] font-semibold uppercase leading-none text-slate-500">
                        Total
                      </span>
                    ) : null}
                  </div>
                  <div
                    className="flex min-w-0 items-center px-2"
                    style={{ width: METRIC_COL_PX }}
                  >
                    <span
                      className="truncate text-xs font-semibold leading-none text-[#396bea]"
                      title={metric}
                    >
                      {metric}
                    </span>
                  </div>
                </div>
              </td>
              <MonthColumns
                metric={metric}
                unit={item.unit}
                values={values}
                className={clsx(TOTAL_ROW_BG, totalCellBorder)}
              />
            </tr>
          );
        })}
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
        const cellBorder = customerDataCellBorder(metric);

        return (
          <tr
            key={`${cust}-${metric}`}
            className={clsx(DATA_ROW, "hover:bg-slate-50/80")}
          >
            {isForecast && (
              <td
                rowSpan={METRICS_PER_CUST}
                className={clsx(
                  cellBase,
                  COL_CUST,
                  STICKY_Z.body,
                  CUST_GROUP_END_BORDER,
                  "bg-white align-middle"
                )}
              >
                <div className={clsx(innerData, "justify-center")}>
                  <span className="text-xs font-semibold leading-none text-slate-700">
                    {cust}
                  </span>
                </div>
              </td>
            )}
            <DataCell
              className={clsx(
                COL_METRIC,
                STICKY_Z.body,
                cellBorder,
                "bg-white"
              )}
            >
              <span className="text-xs leading-none text-slate-500">{metric}</span>
            </DataCell>
            <MonthColumns
              metric={metric}
              unit={unit}
              values={values}
              className={clsx(cellBorder, "bg-white")}
            />
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
      <div className="w-full overflow-x-auto">
        <table
          className="w-full table-fixed border-collapse text-left text-sm"
          style={{ minWidth: TABLE_MIN_WIDTH_PX }}
        >
          <colgroup>
            <col style={{ width: CUST_COL_PX, minWidth: CUST_COL_PX }} />
            <col style={{ width: METRIC_COL_PX, minWidth: METRIC_COL_PX }} />
            {PSI_MONTHS.map((_, i) => (
              <col
                key={`col-m-${i}`}
                style={{ width: MONTH_COL_WIDTH, minWidth: MONTH_COL_MIN_PX }}
              />
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
                      MONTH_CELL,
                      i === MONTH_COUNT - 1 && "border-r-0",
                      "border-b border-slate-200",
                      isCurrent ? "bg-blue-50" : "bg-slate-50"
                    )}
                  >
                    <div className={innerMonthHead}>
                      <span
                        className={clsx(
                          "text-xs font-semibold uppercase tracking-wide tabular-nums",
                          isCurrent
                            ? "font-bold text-blue-600"
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
