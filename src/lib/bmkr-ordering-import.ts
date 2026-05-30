import * as XLSX from "xlsx";
import type { InventoryItem, ProductForm, Region } from "./types";
import { deriveMinStock } from "./types";
import { generateId } from "./storage";

function sumPositiveCells(row: unknown[]): number {
  let sum = 0;
  for (let c = 2; c < row.length; c++) {
    const n = Number(row[c]);
    if (Number.isFinite(n) && n > 0) sum += n;
  }
  return sum;
}

function sumMonthlyCells(row: unknown[]): number {
  let sum = 0;
  for (let c = 2; c < row.length; c++) {
    const n = Number(row[c]);
    if (Number.isFinite(n) && n > 0) sum += n;
  }
  return sum;
}

function inferFormFromDimensions(dim: string): ProductForm {
  const d = dim.toLowerCase();
  if (/\bt\b|tube|pipe/i.test(d)) return "tube";
  if (/coil/i.test(d)) return "coil";
  if (/bar|round/i.test(d)) return "bar";
  if (/sheet|plate|flat/i.test(d)) return "flat";
  if (/strip/i.test(d)) return "strip";
  return "other";
}

function custToRegion(cust: string): Region {
  const c = cust.toUpperCase();
  if (c === "BMAG") return "BMAG";
  if (c === "BMKR") return "BMKR";
  return "BMKR";
}

interface DetailSheetMeta {
  itemCode: string;
  dimensions: string;
  moq: string;
  /** Actual kg totals from the ordering sheet (by customer code). */
  actualKg: Record<string, number>;
}

function parseDetailSheet(rows: unknown[][]): DetailSheetMeta {
  const meta: DetailSheetMeta = {
    itemCode: "",
    dimensions: "",
    moq: "",
    actualKg: {},
  };

  for (const row of rows) {
    const label = String(row[1] ?? "").trim();
    if (!label) continue;

    if (/"\s*T\s*x/i.test(label) || /\d+(\.\d+)?"\s*[x×]/i.test(label)) {
      meta.dimensions = label;
    }
    if (/^I\/C\s+/i.test(label)) {
      meta.itemCode = label.replace(/^I\/C\s+/i, "").trim();
    }
    if (/MOQ/i.test(label)) meta.moq = label;

    const m = label.match(/^(BM[A-Z]{2,3})\s*-\s*Actual/i);
    if (m) {
      meta.actualKg[m[1].toUpperCase()] = sumPositiveCells(row);
    }
  }

  return meta;
}

interface DemantraRow {
  itemCode: string;
  cust: string;
  forecastKg: number;
}

function parseDemantraSheet(rows: unknown[][]): DemantraRow[] {
  const out: DemantraRow[] = [];
  let currentCode = "";

  for (const row of rows) {
    const col0 = row[0];
    const col1 = String(row[1] ?? "").trim();

    if (col0 && col1 !== "Cust" && col1 !== "kgs" && col0 !== "Update") {
      currentCode = String(col0).trim();
    }
    if (!currentCode || col1 === "Cust" || col1 === "kgs" || col1 === "Total" || !col1) {
      continue;
    }

    out.push({
      itemCode: currentCode,
      cust: col1.toUpperCase(),
      forecastKg: sumMonthlyCells(row),
    });
  }

  return out;
}

function buildItem(
  itemCode: string,
  cust: string,
  quantity: number,
  dimensions: string,
  moq: string,
  forecastKg: number
): InventoryItem {
  const region = custToRegion(cust);
  const productForm = inferFormFromDimensions(dimensions);
  const articleNo = `I/C ${itemCode} · ${cust}`;
  const draft = {
    id: "",
    region,
    articleNo,
    material: "",
    alloy: "",
    productForm,
    dimensions,
    quantity,
    unit: "kg",
    location: cust,
    minStock: 0,
    supplier: "BIBUS Korea",
    notes: "",
    updatedAt: "",
  };
  const minStock = deriveMinStock(draft as InventoryItem);

  return {
    ...draft,
    id: generateId(),
    minStock,
    notes: [
      "Source: BMKR Ordering Status (053026)",
      dimensions && `Spec: ${dimensions}`,
      moq,
      forecastKg > 0 && `Forecast total: ${forecastKg} kg`,
      cust !== "BMKR" && region === "BMKR" && `Ordering cust: ${cust}`,
    ]
      .filter(Boolean)
      .join("; "),
    updatedAt: new Date().toISOString(),
  };
}

export function isBmkrOrderingWorkbook(workbook: XLSX.WorkBook): boolean {
  return (
    Boolean(workbook.Sheets["Demantra"]) &&
    workbook.SheetNames.some((n) => /^\d+$/.test(n) || n === "905310")
  );
}

/** Parse BMKR Ordering Status workbook (Demantra + item detail sheet). */
export function parseBmkrOrderingWorkbook(
  workbook: XLSX.WorkBook
): InventoryItem[] {
  const demantraRows = parseDemantraSheet(
    XLSX.utils.sheet_to_json(workbook.Sheets["Demantra"], {
      header: 1,
      defval: "",
    }) as unknown[][]
  );

  const detailSheetName =
    workbook.SheetNames.find((n) => n === "905310" || /^\d+$/.test(n)) ?? "";
  let detail: DetailSheetMeta = {
    itemCode: "",
    dimensions: "",
    moq: "",
    actualKg: {},
  };
  if (detailSheetName && workbook.Sheets[detailSheetName]) {
    detail = parseDetailSheet(
      XLSX.utils.sheet_to_json(workbook.Sheets[detailSheetName], {
        header: 1,
        defval: "",
      }) as unknown[][]
    );
  }

  const items: InventoryItem[] = [];

  for (const row of demantraRows) {
    const useDetail =
      detail.itemCode &&
      row.itemCode === detail.itemCode &&
      detail.actualKg[row.cust] != null;
    const quantity = useDetail
      ? detail.actualKg[row.cust]
      : row.forecastKg;
    const dimensions =
      row.itemCode === detail.itemCode ? detail.dimensions : "";
    const moq = row.itemCode === detail.itemCode ? detail.moq : "";

    if (quantity <= 0 && row.forecastKg <= 0) continue;

    items.push(
      buildItem(
        row.itemCode,
        row.cust,
        quantity > 0 ? quantity : row.forecastKg,
        dimensions,
        moq,
        row.forecastKg
      )
    );
  }

  return items;
}
