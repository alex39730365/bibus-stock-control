"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  AlertTriangle,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Truck,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import {
  MOS_RISK_THRESHOLD,
  PSI_CURRENT_MONTH_INDEX,
  PSI_MOCK_SOURCES,
  PSI_MONTHS,
  buildPsiItems,
  computePsiKpis,
  formatPsiValue,
  isShortageRiskValue,
  type PsiItem,
  type PsiMetricLine,
} from "@/lib/psi-mock-data";

/** Sticky left columns — solid backgrounds so scrolled values do not bleed through. */
const STICKY_Z = {
  head: "z-40",
  row: "z-30",
  body: "z-20",
} as const;

const stickyCol1 =
  "sticky left-0 min-w-[120px] border-r border-gray-200";
const stickyCol2 =
  "sticky left-[120px] min-w-[80px] border-r border-gray-200";
const stickyCol3 =
  "sticky left-[200px] min-w-[108px] border-r border-gray-200 shadow-[4px_0_8px_-2px_rgba(15,23,42,0.1)]";

function PsiKpiCards({ items }: { items: PsiItem[] }) {
  const kpi = useMemo(() => computePsiKpis(items), [items]);

  const cards = [
    {
      label: "Total Demand",
      sub: `${PSI_MONTHS[PSI_CURRENT_MONTH_INDEX]} · actual / forecast roll-up`,
      value: formatNumber(kpi.totalDemand),
      unit: "kg",
      icon: TrendingUp,
      color: "text-[#396bea]",
      bg: "bg-blue-50",
      alert: false,
    },
    {
      label: "Active Shortage Items",
      sub: `MoS < ${MOS_RISK_THRESHOLD.toFixed(1)} months`,
      value: formatNumber(kpi.activeShortageItems),
      unit: "items",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
      alert: true,
    },
    {
      label: "Total Schedule Receipts",
      sub: "ETA this month",
      value: formatNumber(kpi.totalScheduleReceipts),
      unit: "kg",
      icon: Truck,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      alert: false,
    },
    {
      label: "Avg Months of Supply",
      sub: "Portfolio average",
      value: kpi.avgMonthsOfSupply.toFixed(1),
      unit: "months",
      icon: CalendarRange,
      color:
        kpi.avgMonthsOfSupply < MOS_RISK_THRESHOLD
          ? "text-red-600"
          : "text-gray-700",
      bg:
        kpi.avgMonthsOfSupply < MOS_RISK_THRESHOLD
          ? "bg-red-50"
          : "bg-gray-100",
      alert: kpi.avgMonthsOfSupply < MOS_RISK_THRESHOLD,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(
        ({ label, sub, value, unit, icon: Icon, color, bg, alert }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className={clsx("rounded-lg p-3", bg)}>
              <Icon className={color} size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">{label}</p>
              <p
                className={clsx(
                  "text-2xl font-bold",
                  alert ? "text-red-600" : "text-gray-900"
                )}
              >
                {value}
                <span className="ml-1 text-sm font-normal text-gray-500">
                  {unit}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function MetricCell({
  metric,
  value,
  unit,
}: {
  metric: PsiMetricLine | "Total Demand";
  value: number | null;
  unit: string;
}) {
  const numeric = value ?? 0;
  const risky = isShortageRiskValue(
    metric === "Total Demand" ? "Forecast" : metric,
    numeric
  );
  const display =
    value === null
      ? "—"
      : metric === "Total Demand"
        ? formatPsiValue("Forecast", numeric, unit)
        : formatPsiValue(metric, numeric, unit);

  return (
    <td
      className={clsx(
        "px-2 py-1 text-right text-xs tabular-nums",
        risky && metric === "Shortage" && "font-medium text-red-500",
        risky && metric === "Months of Supply" && "bg-red-50 text-red-700",
        metric === "Ending Inventory" &&
          numeric < 0 &&
          "bg-red-50/50 text-red-600"
      )}
    >
      <span className="inline-flex items-center justify-end gap-1">
        {risky && metric === "Months of Supply" && (
          <AlertTriangle size={12} className="shrink-0 text-red-500" />
        )}
        {display}
      </span>
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
      <tr
        className="cursor-pointer border-t border-gray-200 bg-gray-50 hover:bg-gray-100"
        onClick={() => setOpen((v) => !v)}
      >
        <td
          colSpan={2}
          className={clsx(
            stickyCol1,
            STICKY_Z.row,
            "min-w-[200px] bg-gray-50 px-3 py-2.5"
          )}
        >
          <div className="flex items-center gap-2">
            {open ? (
              <ChevronDown size={16} className="text-gray-500" />
            ) : (
              <ChevronRight size={16} className="text-gray-500" />
            )}
            <div>
              <p className="font-mono text-sm font-semibold text-[#396bea]">
                {item.itemCode}
              </p>
              <p className="text-xs text-gray-500">{item.spec}</p>
            </div>
          </div>
        </td>
        <td
          className={clsx(
            stickyCol3,
            STICKY_Z.row,
            "bg-gray-50 px-2 py-2.5 text-xs text-gray-400"
          )}
        >
          {open ? "Collapse" : `${item.customers.length} customers`}
        </td>
        {PSI_MONTHS.map((m, i) => (
          <td
            key={`${item.itemCode}-header-${i}`}
            className="bg-gray-50 px-2 py-2.5 text-right text-xs text-gray-400"
          >
            —
          </td>
        ))}
      </tr>

      {open &&
        item.customers.map((c) => (
          <CustomerMetricRows
            key={`${item.itemCode}-${c.cust}`}
            itemCode={item.itemCode}
            cust={c.cust}
            forecast={c.forecast}
            actual={c.actual}
            shortage={c.shortage}
            unit={item.unit}
          />
        ))}

      {open &&
        totalMetrics.map(({ metric, values }) => (
          <tr
            key={`${item.itemCode}-${metric}`}
            className="border-t border-gray-100 bg-blue-50"
          >
            <td
              className={clsx(
                stickyCol1,
                STICKY_Z.body,
                "bg-blue-50 px-3 py-1 text-xs font-medium text-gray-600"
              )}
            >
              {item.itemCode}
            </td>
            <td
              className={clsx(
                stickyCol2,
                STICKY_Z.body,
                "bg-blue-50 px-2 py-1 text-xs text-gray-500"
              )}
            >
              Total
            </td>
            <td
              className={clsx(
                stickyCol3,
                STICKY_Z.body,
                "bg-blue-50 px-2 py-1 text-xs font-semibold text-[#396bea]"
              )}
            >
              {metric}
            </td>
            {values.map((v, i) => (
              <MetricCell
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
  itemCode,
  cust,
  forecast,
  actual,
  shortage,
  unit,
}: {
  itemCode: string;
  cust: string;
  forecast: number[];
  actual: (number | null)[];
  shortage: number[];
  unit: string;
}) {
  const rows: { metric: PsiMetricLine | "Total Demand"; values: (number | null)[] }[] =
    [
      { metric: "Forecast", values: forecast },
      { metric: "Actual", values: actual },
      { metric: "Shortage", values: shortage },
    ];

  return (
    <>
      {rows.map(({ metric, values }, idx) => (
        <tr key={`${itemCode}-${cust}-${metric}`} className="hover:bg-gray-50">
          <td
            className={clsx(
              stickyCol1,
              STICKY_Z.body,
              "border-gray-100 bg-white px-3 py-1 text-xs text-gray-300"
            )}
          >
            {idx === 0 ? itemCode : ""}
          </td>
          <td
            className={clsx(
              stickyCol2,
              STICKY_Z.body,
              "border-gray-100 bg-white px-2 py-1 text-xs font-medium text-gray-700"
            )}
          >
            {idx === 0 ? cust : ""}
          </td>
          <td
            className={clsx(
              stickyCol3,
              STICKY_Z.body,
              "bg-white px-2 py-1 text-xs text-gray-500"
            )}
          >
            {metric}
          </td>
          {values.map((v, i) => (
            <MetricCell key={i} metric={metric} value={v} unit={unit} />
          ))}
        </tr>
      ))}
    </>
  );
}

function PsiTimelineTable({ items }: { items: PsiItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-800">
          PSI / Demantra Timeline
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Demand = posted actual (incl. 0) per branch, else 0; Beginning →
          +Receipts −Demand = Ending; MoS = Ending ÷ avg(next 3 months demand).
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th
                className={clsx(
                  stickyCol1,
                  STICKY_Z.head,
                  "border-b border-gray-200 bg-gray-50 px-3 py-3"
                )}
              >
                Item Code
              </th>
              <th
                className={clsx(
                  stickyCol2,
                  STICKY_Z.head,
                  "border-b border-gray-200 bg-gray-50 px-2 py-3"
                )}
              >
                Cust
              </th>
              <th
                className={clsx(
                  stickyCol3,
                  STICKY_Z.head,
                  "border-b border-gray-200 bg-gray-50 px-2 py-3"
                )}
              >
                Metric
              </th>
              {PSI_MONTHS.map((m, i) => (
                <th
                  key={`${m}-${i}`}
                  className={clsx(
                    "min-w-[72px] px-2 py-3 text-right",
                    i === PSI_CURRENT_MONTH_INDEX &&
                      "bg-blue-50/80 text-[#396bea]"
                  )}
                >
                  {m}
                  {i === PSI_CURRENT_MONTH_INDEX && (
                    <span className="mt-0.5 block text-[10px] font-normal normal-case text-blue-400">
                      current
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
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
  const items = useMemo(
    () => buildPsiItems(PSI_MOCK_SOURCES),
    []
  );

  return (
    <div className="space-y-6">
      <PsiKpiCards items={items} />
      <PsiTimelineTable items={items} />
      <p className="text-xs text-gray-400">
        Mock inputs · roll-forward inventory · MoS risk &lt; {MOS_RISK_THRESHOLD}{" "}
        months
      </p>
    </div>
  );
}
