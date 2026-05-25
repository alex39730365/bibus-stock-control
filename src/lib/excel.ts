import * as XLSX from "xlsx";
import type { ImportResult, InventoryItem, ProductForm } from "./types";
import { PRODUCT_FORMS, defaultUnitForForm } from "./types";
import { generateId } from "./storage";
import {
  isCentralizationWorkbook,
  parseCentralizationWorkbook,
} from "./centralization-import";
import {
  formatArticleCodeNotes,
  parseArticleCode,
} from "./article-code";

/** Excel column mapping (English + alternate header aliases) */
const COLUMN_MAP: Record<string, keyof Omit<InventoryItem, "id" | "updatedAt">> = {
  region: "region",
  articleno: "articleNo",
  article_no: "articleNo",
  article: "articleNo",
  "article no": "articleNo",
  "article no.": "articleNo",
  sku: "articleNo",

  material: "material",

  alloy: "alloy",
  "alloy grade": "alloy",

  productform: "productForm",
  product_form: "productForm",
  form: "productForm",
  "product form": "productForm",

  dimensions: "dimensions",
  size: "dimensions",

  quantity: "quantity",
  qty: "quantity",
  stock: "quantity",

  unit: "unit",

  location: "location",
  warehouse: "location",

  minstock: "minStock",
  min_stock: "minStock",
  "min stock": "minStock",
  "minimum stock": "minStock",

  supplier: "supplier",
  supplier_name: "supplier",

  notes: "notes",
  remark: "notes",
  remarks: "notes",
};

const LEGACY_FORM_MAP: Record<string, ProductForm> = {
  "bar/wire": "bar",
  "sheet/plate": "flat",
  "tube/pipe": "tube",
  welding: "electrodes",
  other: "other",
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseProductForm(value: unknown): ProductForm {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return "other";
  if (LEGACY_FORM_MAP[s]) return LEGACY_FORM_MAP[s];
  const found = PRODUCT_FORMS.find((f) => f === s || f.includes(s));
  if (found) return found;
  if (s.includes("bar")) return "bar";
  if (s.includes("tube") || s.includes("pipe")) return "tube";
  if (s.includes("strip")) return "strip";
  if (s.includes("coil")) return "coil";
  if (s.includes("flat") || s.includes("sheet") || s.includes("plate"))
    return "flat";
  if (s.includes("weld") || s.includes("electrode")) return "electrodes";
  if (s.includes("filler")) return "filler metal";
  return "other";
}

function rowToItem(
  row: Record<string, unknown>,
  headerMap: Map<number, keyof Omit<InventoryItem, "id" | "updatedAt">>
): Partial<InventoryItem> | null {
  const item: Partial<InventoryItem> = {};

  for (const [colIdx, field] of headerMap) {
    const keys = Object.keys(row);
    const key = keys[colIdx];
    if (!key) continue;
    const val = row[key];
    if (val === undefined || val === null || val === "") continue;

    if (field === "quantity" || field === "minStock") {
      const num = Number(String(val).replace(/,/g, ""));
      if (!Number.isNaN(num)) (item as Record<string, unknown>)[field] = num;
    } else if (field === "productForm") {
      item.productForm = parseProductForm(val);
    } else {
      (item as Record<string, unknown>)[field] = String(val).trim();
    }
  }

  if (!item.articleNo) return null;
  return item;
}

export type ParseExcelResult = ImportResult & { items: InventoryItem[] };

export function parseExcelBuffer(buffer: ArrayBuffer): ParseExcelResult {
  const workbook = XLSX.read(buffer, { type: "array" });

  if (isCentralizationWorkbook(workbook)) {
    const items = parseCentralizationWorkbook(workbook);
    return {
      imported: items.length,
      updated: 0,
      skipped: 0,
      errors: items.length === 0 ? ["No data rows found in BMAG/BMCN sheets."] : [],
      items,
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: ["No worksheet found."],
      items: [],
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (rows.length === 0) {
    return {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: ["No data rows found."],
      items: [],
    };
  }

  const headers = Object.keys(rows[0]);
  const headerMap = new Map<number, keyof Omit<InventoryItem, "id" | "updatedAt">>();

  headers.forEach((h, idx) => {
    const norm = normalizeHeader(h).replace(/\s/g, "");
    const normSpaced = normalizeHeader(h);
    const field =
      COLUMN_MAP[norm] ?? COLUMN_MAP[normSpaced] ?? COLUMN_MAP[normSpaced.replace(/\s/g, "_")];
    if (field) headerMap.set(idx, field);
  });

  if (headerMap.size === 0) {
    return {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [
        "No recognizable columns. Ensure headers include articleNo and quantity.",
      ],
      items: [],
    };
  }

  const items: InventoryItem[] = [];
  const errors: string[] = [];

  rows.forEach((row, i) => {
    const partial = rowToItem(row, headerMap);
    if (!partial?.articleNo) {
      errors.push(`Row ${i + 2}: missing articleNo — skipped`);
      return;
    }

    const parsed = parseArticleCode(partial.articleNo);
    const codeNotes = formatArticleCodeNotes(parsed);
    const notes = [codeNotes, partial.notes].filter(Boolean).join("; ");

    items.push({
      id: generateId(),
      region:
        partial.region === "BMCN" || partial.region === "BMAG"
          ? partial.region
          : "BMAG",
      articleNo: partial.articleNo,
      material: partial.material ?? "",
      alloy: partial.alloy ?? "",
      productForm: parsed.formCode
        ? parsed.productForm
        : (partial.productForm ?? "other"),
      dimensions: partial.dimensions ?? "",
      quantity: partial.quantity ?? 0,
      unit: partial.unit ?? defaultUnitForForm(parsed.productForm),
      location: partial.location ?? "",
      minStock: partial.minStock ?? 0,
      supplier: partial.supplier ?? "",
      notes,
      updatedAt: new Date().toISOString(),
    });
  });

  return {
    imported: items.length,
    updated: 0,
    skipped: rows.length - items.length,
    errors,
    items,
  };
}

export function exportToExcelBuffer(items: InventoryItem[]): ArrayBuffer {
  const rows = items.map((i) => ({
    region: i.region,
    articleNo: i.articleNo,
    material: i.material,
    alloy: i.alloy,
    productForm: i.productForm,
    dimensions: i.dimensions,
    quantity: i.quantity,
    unit: i.unit,
    location: i.location,
    minStock: i.minStock,
    supplier: i.supplier,
    notes: i.notes,
    updatedAt: i.updatedAt,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 10 },
    { wch: 8 },
    { wch: 12 },
    { wch: 10 },
    { wch: 16 },
    { wch: 24 },
    { wch: 22 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventory");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export function createTemplateBuffer(): ArrayBuffer {
  const sample = [
    {
      articleNo: "NI-625-BAR-25",
      material: "Nickel",
      alloy: "Inconel 625",
      productForm: "bar",
      dimensions: "Ø25 x 3000mm",
      quantity: 450,
      unit: "kg",
      location: "WH-A-12",
      minStock: 100,
      supplier: "BIBUS METALS AG",
      notes: "Aerospace grade",
    },
    {
      articleNo: "TI-64-SHT-3",
      material: "Titanium",
      alloy: "Ti-6Al-4V",
      productForm: "flat",
      dimensions: "3 x 1000 x 2000mm",
      quantity: 28,
      unit: "pcs",
      location: "WH-B-04",
      minStock: 50,
      supplier: "BIBUS METALS AG",
      notes: "Low stock example",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}
