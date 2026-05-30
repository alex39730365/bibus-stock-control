/**
 * Mock Demantra / PSI inputs + Excel-aligned roll-forward inventory calculations.
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

const CALENDAR_MONTH_INDEX: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

/** Timeline labels: Apr 2026 → May 2027 (matches Demantra / ordering workbook). */
export interface PsiTimelineMonth {
  month: PsiMonthKey;
  year: number;
  /** e.g. `Apr '26` */
  label: string;
}

function buildPsiMonthColumns(): PsiTimelineMonth[] {
  let year = 2026;
  let prevCal = -1;
  return PSI_MONTHS.map((month) => {
    const cal = CALENDAR_MONTH_INDEX[month] ?? 0;
    if (prevCal >= 0 && cal < prevCal) year += 1;
    prevCal = cal;
    const shortYear = String(year).slice(-2);
    return { month, year, label: `${month} '${shortYear}` };
  });
}

export const PSI_MONTH_COLUMNS = buildPsiMonthColumns();

export function formatPsiMonthLabel(monthIndex: number): string {
  return PSI_MONTH_COLUMNS[monthIndex]?.label ?? PSI_MONTHS[monthIndex] ?? "";
}

export const MOS_RISK_THRESHOLD = 3.0;
/** Below 1 month of supply → danger tier (badge dot). */
export const MOS_DANGER_THRESHOLD = 1.0;

export type MosTier = "safe" | "warning" | "danger";

export function getMosTier(mos: number): MosTier {
  if (!Number.isFinite(mos) || mos < MOS_DANGER_THRESHOLD) return "danger";
  if (mos < MOS_RISK_THRESHOLD) return "warning";
  return "safe";
}

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
  /** `null` = cell blank (no actual posted); number includes 0 when posted. */
  actual: (number | null)[];
  shortage: number[];
}

/** Source fields from Excel / Demantra — totals are derived. */
export interface PsiItemSource {
  itemCode: string;
  spec: string;
  unit: string;
  /** Beginning inventory for the first month (Apr) only. */
  initialInventory: number;
  scheduleReceipt: number[];
  customers: PsiCustomerLines[];
}

export interface PsiItemTotals {
  beginningInventory: number[];
  scheduleReceipt: number[];
  endingInventory: number[];
  monthsOfSupply: number[];
  /** Roll-up demand used for inventory & MoS (Excel “Total - Actual/Forecast”). */
  totalDemand: number[];
}

export interface PsiItem extends PsiItemSource {
  totals: PsiItemTotals;
}

export interface PsiKpiSummary {
  totalDemand: number;
  activeShortageItems: number;
  totalScheduleReceipts: number;
  /** Portfolio MoS; `null` when not computable (empty portfolio, NaN, etc.). */
  avgMonthsOfSupply: number | null;
}

export interface PortfolioAvgMosDisplay {
  display: string;
  unit: string | null;
  alert: boolean;
}

/** KPI card formatting — no `Infinity mo` leakage. */
export function formatPortfolioAvgMos(
  value: number | null | undefined
): PortfolioAvgMosDisplay {
  if (
    value == null ||
    !Number.isFinite(value) ||
    Number.isNaN(value)
  ) {
    return { display: "—", unit: null, alert: false };
  }
  return {
    display: value.toFixed(1),
    unit: "mo",
    alert: value < MOS_RISK_THRESHOLD,
  };
}

/** Current month index for KPI focus (May = index 1 in this mock). */
export const PSI_CURRENT_MONTH_INDEX = 1;

/** True when ending inventory goes negative from `fromMonthIndex` onward. */
export function hasFutureEndingShortage(
  endingInventory: number[],
  fromMonthIndex: number = PSI_CURRENT_MONTH_INDEX
): boolean {
  return endingInventory.slice(fromMonthIndex).some((v) => v < 0);
}

const MONTH_COUNT = PSI_MONTHS.length;

/** True when Excel has a posted actual (including 0). */
export function isActualPosted(value: number | null | undefined): boolean {
  return value !== null && value !== undefined;
}

/**
 * Per-customer demand for one month (matches Excel “Total - Actual/Forecast”):
 * posted actual (including 0) → use actual; blank cell → 0 (not forecast).
 */
export function customerDemandForMonth(
  customer: PsiCustomerLines,
  monthIndex: number
): number {
  const actual = customer.actual[monthIndex];
  if (isActualPosted(actual)) return actual as number;
  return 0;
}

/** Sum of per-customer demand for one month. */
export function totalDemandForMonth(
  customers: PsiCustomerLines[],
  monthIndex: number
): number {
  return customers.reduce(
    (sum, c) => sum + customerDemandForMonth(c, monthIndex),
    0
  );
}

/**
 * Denominator for Months of Supply: average of the next up-to-3 months’ total demand.
 * Near timeline end: use the last 3 demand values, or current-month demand as fallback.
 */
export function avgForwardTotalDemand(
  totalDemand: number[],
  monthIndex: number,
  forwardMonths = 3
): number {
  const forward: number[] = [];
  for (let j = 1; j <= forwardMonths; j++) {
    const idx = monthIndex + j;
    if (idx < MONTH_COUNT) forward.push(totalDemand[idx] ?? 0);
  }

  if (forward.length === forwardMonths) {
    return forward.reduce((a, b) => a + b, 0) / forwardMonths;
  }

  if (forward.length > 0) {
    return forward.reduce((a, b) => a + b, 0) / forward.length;
  }

  const trailing = totalDemand.slice(
    Math.max(0, MONTH_COUNT - forwardMonths)
  );
  if (trailing.length > 0) {
    return trailing.reduce((a, b) => a + b, 0) / trailing.length;
  }

  const current = totalDemand[monthIndex] ?? 0;
  return current !== 0 ? current : 1;
}

/**
 * Roll-forward inventory (Apr → next May):
 * - Beginning[0] = initialInventory (master)
 * - Beginning[m] = Ending[m-1]
 * - Ending[m] = Beginning[m] + ScheduleReceipt[m] - TotalDemand[m]
 * - MoS[m] = Ending[m] / avg(next 3 months TotalDemand) — no clamping on negatives
 */
export function computeItemTotals(source: PsiItemSource): PsiItemTotals {
  const beginningInventory: number[] = [];
  const endingInventory: number[] = [];
  const monthsOfSupply: number[] = [];
  const totalDemand: number[] = [];

  for (let i = 0; i < MONTH_COUNT; i++) {
    totalDemand.push(totalDemandForMonth(source.customers, i));
  }

  for (let i = 0; i < MONTH_COUNT; i++) {
    const beginning =
      i === 0 ? source.initialInventory : endingInventory[i - 1]!;
    beginningInventory.push(beginning);

    const receipt = source.scheduleReceipt[i] ?? 0;
    const demand = totalDemand[i]!;
    const ending = beginning + receipt - demand;
    endingInventory.push(ending);

    const forwardAvg = avgForwardTotalDemand(totalDemand, i);
    const mos =
      forwardAvg === 0 || !Number.isFinite(forwardAvg)
        ? 0
        : ending / forwardAvg;
    monthsOfSupply.push(Number.isFinite(mos) ? mos : 0);
  }

  return {
    beginningInventory,
    scheduleReceipt: [...source.scheduleReceipt],
    endingInventory,
    monthsOfSupply,
    totalDemand,
  };
}

export function enrichPsiItem(source: PsiItemSource): PsiItem {
  return { ...source, totals: computeItemTotals(source) };
}

export const PSI_MOCK_SOURCES: PsiItemSource[] = [
  {
    itemCode: "I/C 905310",
    spec: '1.5" T x 10.0" W x 144" L · MOQ 500 kg',
    unit: "kg",
    initialInventory: 10000,
    scheduleReceipt: [
      0, 3000, 4000, 3000, 6000, 2500, 3000, 16000, 15000, 0, 15000, 500, 9000,
      0,
    ],
    customers: [
      {
        cust: "BMKR",
        forecast: [
          1700, 0, 1700, 0, 1700, 0, 1700, 0, 1700, 2204, 0, 2204, 0, 2204,
        ],
        actual: [
          0, null, null, 2235, null, 2286, null, 7015, 7016, 700, 3586, null,
          null, null,
        ],
        shortage: [
          -1700, 0, -1700, 2235, -1700, 2286, -1700, 7015, 5316, -1504, 3586,
          -2204, 0, -2204,
        ],
      },
      {
        cust: "BMXX",
        forecast: [
          0, 2204, 2204, 4408, 4408, 4408, 2204, 2204, 2205, 0, 500, 0, 500, 0,
        ],
        actual: [
          500, 3315, 3843, 2009, null, 2292, null, null, null, null, 6623, null,
          null, null,
        ],
        shortage: [
          500, 1111, 1639, -2399, -4408, -2116, -2204, -2204, -2205, 0, 6123, 0,
          -500, 0,
        ],
      },
      {
        cust: "BMXY",
        forecast: [
          2204, 2204, 2204, 2204, 2204, 2204, 2204, 2204, 2205, 800, 0, 800, 0,
          800,
        ],
        actual: [
          1000, null, 2625, 2142, null, null, 3356, 6234, 6235, null, null, 2305,
          null, null,
        ],
        shortage: [
          -1204, -2204, 421, -62, -2204, -2204, 1152, 4030, 4030, -800, 0, 1505,
          0, -800,
        ],
      },
      {
        cust: "BMYZ",
        forecast: [
          2204, 2204, 2204, 2204, 0, 0, 0, 0, 1, 100, 0, 100, 0, 100,
        ],
        actual: [
          0, 2190, 1610, 0, 1995, 0, 0, 0, 1, 0, 0, 0, 0, 0,
        ],
        shortage: [
          -2204, -14, -594, -2204, 1995, 0, 0, 0, 0, -100, 0, -100, 0, -100,
        ],
      },
      {
        cust: "BMAG",
        forecast: [
          200, 0, 200, 0, 200, 0, 200, 0, 200, 1800, 1800, 1800, 1800, 1800,
        ],
        actual: [
          50, null, null, null, null, null, null, null, null, null, 4901, null,
          null, null,
        ],
        shortage: [
          -150, 0, -200, 0, -200, 0, -200, 0, -200, -1800, 3101, -1800, -1800,
          -1800,
        ],
      },
      {
        cust: "BMAA",
        forecast: [
          2000, 1000, 0, 2000, 1000, 0, 2000, 0, 1000, 0, 1000, 0, 1000, 500,
        ],
        actual: [
          1500, null, null, null, 300, null, 300, null, null, null, null, 1181,
          null, null,
        ],
        shortage: [
          -500, -1000, 0, -2000, -700, 0, -1700, 0, -1000, 0, -1000, 1181,
          -1000, -500,
        ],
      },
    ],
  },
  {
    itemCode: "I/C 234567",
    spec: "Nickel alloy tube — project lot",
    unit: "kg",
    initialInventory: 8000,
    scheduleReceipt: [
      5500, 2200, 1100, 2200, 0, 1100, 0, 1100, 0, 0, 0, 0, 0, 0,
    ],
    customers: [
      {
        cust: "BMXX",
        forecast: [
          1100, 1100, 1100, 1100, 1100, 1100, 1100, 1100, 1100, 1100, 1100,
          1100, 1100, 1100,
        ],
        actual: [
          1100, null, 1100, null, null, 1100, null, 1100, null, null, null, null,
          null, null,
        ],
        shortage: [
          0, -1100, 0, -1100, -1100, 0, -1100, 0, -1100, -1100, -1100, -1100,
          -1100, -1100,
        ],
      },
      {
        cust: "BMXY",
        forecast: [
          4400, 2200, 2200, 2200, 2200, 2200, 2200, 2200, 1800, 1800, 1800,
          1800, 1800, 1800,
        ],
        actual: [
          4400, 2200, null, 2200, null, null, 2200, null, null, null, null, null,
          null, null,
        ],
        shortage: [
          0, 0, -2200, 0, -2200, -2200, 0, -2200, -1800, -1800, -1800, -1800,
          -1800, -1800,
        ],
      },
      {
        cust: "BMKR",
        forecast: [
          0, 0, 0, 2200, 0, 2200, 0, 2200, 0, 0, 0, 0, 0, 0,
        ],
        actual: [
          null, null, null, null, null, null, null, null, null, null, null,
          null, null, null,
        ],
        shortage: [
          0, 0, 0, -2200, 0, -2200, 0, -2200, 0, 0, 0, 0, 0, 0,
        ],
      },
    ],
  },
  {
    itemCode: "I/C 12345",
    spec: "Titanium bar — spot buy",
    unit: "kg",
    initialInventory: 500,
    scheduleReceipt: [0, 1500, 0, 0, 0, 0, 300, 0, 0, 0, 0, 0, 0, 0],
    customers: [
      {
        cust: "BMAA",
        forecast: [
          0, 2200, 0, 2200, 2200, 2200, 2200, 2200, 0, 0, 2200, 0, 2200, 0,
        ],
        actual: [null, 1500, null, null, null, null, 300, null, null, null, null, null, null, null],
        shortage: [
          0, -700, 0, -2200, -2200, -2200, -1900, -2200, 0, 0, -2200, 0, -2200,
          0,
        ],
      },
    ],
  },
];

export function buildPsiItems(
  sources: PsiItemSource[] = PSI_MOCK_SOURCES
): PsiItem[] {
  return sources.map(enrichPsiItem);
}

/** @deprecated Use buildPsiItems() — kept for imports that expect pre-built list */
export const PSI_MOCK_ITEMS = buildPsiItems();

export function computePsiKpis(items: PsiItem[]): PsiKpiSummary {
  const mi = PSI_CURRENT_MONTH_INDEX;
  let totalDemand = 0;
  let totalScheduleReceipts = 0;
  let totalEnding = 0;
  let totalForwardDemand = 0;
  let finiteMosSum = 0;
  let finiteMosCount = 0;
  let activeShortageItems = 0;

  for (const item of items) {
    totalDemand += item.totals.totalDemand[mi] ?? 0;
    totalScheduleReceipts += item.totals.scheduleReceipt[mi] ?? 0;

    const ending = item.totals.endingInventory[mi] ?? 0;
    const forwardAvg = avgForwardTotalDemand(item.totals.totalDemand, mi);
    if (Number.isFinite(ending)) totalEnding += ending;
    if (Number.isFinite(forwardAvg)) totalForwardDemand += forwardAvg;

    const mos = item.totals.monthsOfSupply[mi];
    if (typeof mos === "number" && Number.isFinite(mos)) {
      finiteMosSum += mos;
      finiteMosCount += 1;
    }

    const riskyMonth = item.totals.monthsOfSupply.some(
      (m) => Number.isFinite(m) && m < MOS_RISK_THRESHOLD
    );
    if (riskyMonth) activeShortageItems += 1;
  }

  let avgMonthsOfSupply: number | null = null;
  if (items.length === 0) {
    avgMonthsOfSupply = null;
  } else if (totalForwardDemand === 0) {
    avgMonthsOfSupply = 0;
  } else {
    const ratio = totalEnding / totalForwardDemand;
    avgMonthsOfSupply = Number.isFinite(ratio) ? ratio : null;
  }

  if (
    avgMonthsOfSupply == null &&
    finiteMosCount > 0
  ) {
    const mean = finiteMosSum / finiteMosCount;
    avgMonthsOfSupply = Number.isFinite(mean) ? mean : null;
  }

  return {
    totalDemand,
    activeShortageItems,
    totalScheduleReceipts,
    avgMonthsOfSupply,
  };
}

export function formatPsiValue(
  metric: PsiMetricLine,
  value: number,
  _unit: string
): string {
  if (metric === "Months of Supply") {
    if (!Number.isFinite(value)) return "—";
    const abs = Math.abs(value);
    if (abs >= 99) return "99+";
    if (abs > 0 && abs < 1) return value.toFixed(2);
    return value.toFixed(1);
  }
  if (Number.isInteger(value)) return `${value}`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

export function isShortageRiskValue(
  metric: PsiMetricLine,
  value: number
): boolean {
  if (metric === "Shortage") return value < 0;
  if (metric === "Months of Supply") return value < MOS_RISK_THRESHOLD;
  return false;
}

/** Excel validation targets for I/C 905310 (integration / manual checks). */
export const PSI_905310_EXCEL_CHECKS = {
  apr: { ending: 6950, monthsOfSupplyApprox: 1.04 },
  may: { ending: 4445, monthsOfSupplyApprox: 0.8 },
} as const;
