/**
 * Mock Demantra / PSI data for SCM dashboard prototyping.
 * Month keys align with Apr 2026 → May 2027 (14 months).
 */

export const PSI_MONTHS = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
] as const;

export type PsiMonthKey = (typeof PSI_MONTHS)[number];

export const MOS_RISK_THRESHOLD = 3.0;

export type PsiMetricLine =
  | "Forecast"
  | "Actual"
  | "Shortage"
  | "Beginning Inventory"
  | "Schedule Receipt (ETA)"
  | "Ending Inventory"
  | "Months of Supply";

export interface PsiCustomerLines {
  cust: string;
  forecast: number[];
  actual: number[];
  shortage: number[];
}

export interface PsiItemTotals {
  beginningInventory: number[];
  scheduleReceipt: number[];
  endingInventory: number[];
  monthsOfSupply: number[];
}

export interface PsiItem {
  itemCode: string;
  spec: string;
  unit: string;
  customers: PsiCustomerLines[];
  totals: PsiItemTotals;
}

export interface PsiKpiSummary {
  totalForecastedDemand: number;
  activeShortageItems: number;
  totalScheduleReceipts: number;
  avgMonthsOfSupply: number;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function avg(arr: number[]): number {
  const v = arr.filter((n) => Number.isFinite(n));
  if (v.length === 0) return 0;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

/** Current month index for KPI focus (May = index 1 in this mock). */
export const PSI_CURRENT_MONTH_INDEX = 1;

export const PSI_MOCK_ITEMS: PsiItem[] = [
  {
    itemCode: "I/C 905310",
    spec: '1.5" T x 10.0" W x 144" L · MOQ 500 kg',
    unit: "kg",
    customers: [
      {
        cust: "BMKR",
        forecast: [1700, 1700, 1700, 1700, 1700, 1700, 1700, 1700, 1700, 1700, 1700, 2204, 2204, 1700],
        actual: [0, 0, 2235, 0, 2286, 0, 7015, 7016, 700, 3586, 0, 0, 0, 0],
        shortage: [-1700, 0, 535, -1700, 586, -1700, 5315, 5316, -1500, 3586, -2204, -2204, -2204, -1700],
      },
      {
        cust: "BMXX",
        forecast: [0, 2204, 2204, 4408, 4408, 4408, 2204, 2204, 2205, 0, 500, 0, 0, 0],
        actual: [500, 3315, 3843, 2009, 0, 0, 0, 0, 0, 6623, 0, 0, 0, 0],
        shortage: [500, 1111, 1639, -2399, -4408, -4408, -2204, -2204, -2205, 6623, -500, 0, 0, 0],
      },
      {
        cust: "BMXY",
        forecast: [2204, 2204, 2204, 2204, 2204, 2204, 2204, 2204, 2205, 800, 0, 800, 0, 800],
        actual: [1000, 0, 2625, 2142, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        shortage: [-1204, -2204, 421, -62, -2204, -2204, -2204, -2204, -2205, -800, 0, -800, 0, -800],
      },
      {
        cust: "BMAG",
        forecast: [200, 0, 200, 0, 200, 0, 200, 0, 200, 0, 200, 0, 200, 0],
        actual: [50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        shortage: [-150, 0, -200, 0, -200, 0, -200, 0, -200, 0, -200, 0, -200, 0],
      },
    ],
    totals: {
      beginningInventory: [
        12000, 11800, 14200, 15100, 14800, 16200, 21000, 28500, 29200, 30100, 36800, 36800, 34600, 32400,
      ],
      scheduleReceipt: [
        1500, 3315, 8703, 4151, 2286, 0, 7015, 7016, 700, 10209, 0, 0, 0, 0,
      ],
      endingInventory: [
        11800, 14200, 15100, 14800, 16200, 21000, 28500, 29200, 30100, 36800, 36800, 34600, 32400, 30200,
      ],
      monthsOfSupply: [4.2, 3.8, 2.9, 2.4, 3.1, 2.8, 1.9, 2.2, 2.6, 3.4, 3.0, 2.7, 2.5, 2.3],
    },
  },
  {
    itemCode: "I/C 234567",
    spec: "Nickel alloy tube — project lot",
    unit: "kg",
    customers: [
      {
        cust: "BMXX",
        forecast: [1100, 1100, 1100, 1100, 1100, 1100, 1100, 1100, 1100, 1100, 1100, 1100, 1100, 1100],
        actual: [1100, 0, 1100, 0, 0, 1100, 0, 1100, 0, 0, 0, 0, 0, 0],
        shortage: [0, -1100, 0, -1100, -1100, 0, -1100, 0, -1100, -1100, -1100, -1100, -1100, -1100],
      },
      {
        cust: "BMXY",
        forecast: [4400, 2200, 2200, 2200, 2200, 2200, 2200, 2200, 1800, 1800, 1800, 1800, 1800, 1800],
        actual: [4400, 2200, 0, 2200, 0, 0, 2200, 0, 0, 0, 0, 0, 0, 0],
        shortage: [0, 0, -2200, 0, -2200, -2200, 0, -2200, -1800, -1800, -1800, -1800, -1800, -1800],
      },
      {
        cust: "BMKR",
        forecast: [0, 0, 0, 2200, 0, 2200, 0, 2200, 0, 0, 0, 0, 0, 0],
        actual: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        shortage: [0, 0, 0, -2200, 0, -2200, 0, -2200, 0, 0, 0, 0, 0, 0],
      },
    ],
    totals: {
      beginningInventory: [8000, 8200, 8100, 7900, 7800, 7600, 7500, 7400, 7200, 7100, 7000, 6900, 6800, 6700],
      scheduleReceipt: [5500, 2200, 1100, 2200, 0, 1100, 0, 1100, 0, 0, 0, 0, 0, 0],
      endingInventory: [8200, 8100, 7900, 7800, 7600, 7500, 7400, 7200, 7100, 7000, 6900, 6800, 6700, 6600],
      monthsOfSupply: [3.5, 2.8, 2.1, 1.8, 1.6, 2.0, 1.9, 2.2, 2.4, 2.6, 2.8, 2.9, 3.0, 3.1],
    },
  },
  {
    itemCode: "I/C 12345",
    spec: "Titanium bar — spot buy",
    unit: "kg",
    customers: [
      {
        cust: "BMAA",
        forecast: [0, 2200, 0, 2200, 2200, 2200, 2200, 2200, 0, 0, 2200, 0, 2200, 0],
        actual: [0, 1500, 0, 0, 0, 0, 300, 0, 0, 0, 0, 0, 0, 0],
        shortage: [0, -700, 0, -2200, -2200, -2200, -1900, -2200, 0, 0, -2200, 0, -2200, 0],
      },
    ],
    totals: {
      beginningInventory: [500, 500, 450, 400, 380, 360, 340, 320, 300, 280, 260, 240, 220, 200],
      scheduleReceipt: [0, 1500, 0, 0, 0, 0, 300, 0, 0, 0, 0, 0, 0, 0],
      endingInventory: [500, 450, 400, 380, 360, 340, 320, 300, 280, 260, 240, 220, 200, 180],
      monthsOfSupply: [2.5, 1.2, 0.9, 0.8, 0.7, 0.6, 0.5, 0.5, 0.4, 0.4, 0.3, 0.3, 0.3, 0.2],
    },
  },
];

export function computePsiKpis(items: PsiItem[]): PsiKpiSummary {
  const mi = PSI_CURRENT_MONTH_INDEX;
  let totalForecastedDemand = 0;
  let totalScheduleReceipts = 0;
  let mosSum = 0;
  let activeShortageItems = 0;

  for (const item of items) {
    for (const c of item.customers) {
      totalForecastedDemand += c.forecast[mi] ?? 0;
    }
    totalScheduleReceipts += item.totals.scheduleReceipt[mi] ?? 0;
    const mos = item.totals.monthsOfSupply[mi] ?? 0;
    mosSum += mos;
    const riskyMonth = item.totals.monthsOfSupply.some(
      (m) => m < MOS_RISK_THRESHOLD
    );
    if (riskyMonth) activeShortageItems += 1;
  }

  return {
    totalForecastedDemand,
    activeShortageItems,
    totalScheduleReceipts,
    avgMonthsOfSupply: items.length ? mosSum / items.length : 0,
  };
}

export function formatPsiValue(
  metric: PsiMetricLine,
  value: number,
  unit: string
): string {
  if (metric === "Months of Supply") {
    return value.toFixed(1);
  }
  if (Number.isInteger(value)) return `${value}`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

export function isShortageRiskValue(metric: PsiMetricLine, value: number): boolean {
  if (metric === "Shortage") return value < 0;
  if (metric === "Months of Supply") return value < MOS_RISK_THRESHOLD;
  return false;
}
