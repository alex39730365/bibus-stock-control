/**
 * Merge BMKR Ordering Status .xls into data/inventory.json
 * Usage: node scripts/import-bmkr-ordering.mjs [path-to-xls]
 */
import { createRequire } from "module";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DEFAULT_SOURCE =
  "c:\\Users\\alex3\\OneDrive\\문서\\카카오톡 받은 파일\\053026 BMKR Ordering Status.xls";
const OUT = path.join(ROOT, "data", "inventory.json");

// Inline parser (mirrors src/lib/bmkr-ordering-import.ts for Node script)
function sumPositiveCells(row) {
  let sum = 0;
  for (let c = 2; c < row.length; c++) {
    const n = Number(row[c]);
    if (Number.isFinite(n) && n > 0) sum += n;
  }
  return sum;
}

function sumMonthlyCells(row) {
  let sum = 0;
  for (let c = 2; c < row.length; c++) {
    const n = Number(row[c]);
    if (Number.isFinite(n) && n > 0) sum += n;
  }
  return sum;
}

function inferForm(dim) {
  const d = dim.toLowerCase();
  if (/\bt\b|tube|pipe/i.test(d)) return "tube";
  if (/coil/i.test(d)) return "coil";
  if (/bar|round/i.test(d)) return "bar";
  if (/sheet|plate|flat/i.test(d)) return "flat";
  return "other";
}

function custToRegion(cust) {
  if (cust === "BMAG") return "BMAG";
  if (cust === "BMKR") return "BMKR";
  return "BMKR";
}

function defaultUnit(form) {
  return form === "tube" ? "m" : "kg";
}

function deriveMinStock(quantity) {
  if (quantity <= 0) return 0;
  return Math.max(1, Math.ceil(quantity * 0.3));
}

function generateId() {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function parseDetailSheet(rows) {
  const meta = { itemCode: "", dimensions: "", moq: "", actualKg: {} };
  for (const row of rows) {
    const label = String(row[1] ?? "").trim();
    if (!label) continue;
    if (/"\s*T\s*x/i.test(label)) meta.dimensions = label;
    if (/^I\/C\s+/i.test(label)) meta.itemCode = label.replace(/^I\/C\s+/i, "").trim();
    if (/MOQ/i.test(label)) meta.moq = label;
    const m = label.match(/^(BM[A-Z]{2,3})\s*-\s*Actual/i);
    if (m) meta.actualKg[m[1].toUpperCase()] = sumPositiveCells(row);
  }
  return meta;
}

function parseDemantra(rows) {
  const out = [];
  let currentCode = "";
  for (const row of rows) {
    const col1 = String(row[1] ?? "").trim();
    if (row[0] && col1 !== "Cust" && col1 !== "kgs" && row[0] !== "Update") {
      currentCode = String(row[0]).trim();
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

function parseWorkbook(wb) {
  const demantra = parseDemantra(
    XLSX.utils.sheet_to_json(wb.Sheets["Demantra"], { header: 1, defval: "" })
  );
  const detailName = wb.SheetNames.find((n) => n === "905310" || /^\d+$/.test(n));
  const detail = detailName
    ? parseDetailSheet(
        XLSX.utils.sheet_to_json(wb.Sheets[detailName], { header: 1, defval: "" })
      )
    : { itemCode: "", dimensions: "", moq: "", actualKg: {} };

  const items = [];
  for (const row of demantra) {
    const useDetail =
      detail.itemCode && row.itemCode === detail.itemCode && detail.actualKg[row.cust] != null;
    const quantity = useDetail ? detail.actualKg[row.cust] : row.forecastKg;
    const q = quantity > 0 ? quantity : row.forecastKg;
    if (q <= 0) continue;

    const dimensions = row.itemCode === detail.itemCode ? detail.dimensions : "";
    const productForm = inferForm(dimensions);
    const region = custToRegion(row.cust);
    items.push({
      id: generateId(),
      region,
      articleNo: `I/C ${row.itemCode} · ${row.cust}`,
      material: "",
      alloy: "",
      productForm,
      dimensions,
      quantity: q,
      unit: "kg",
      location: row.cust,
      minStock: deriveMinStock(q),
      supplier: "BIBUS Korea",
      notes: [
        "Source: BMKR Ordering Status (053026)",
        dimensions && `Spec: ${dimensions}`,
        detail.moq,
        row.forecastKg > 0 && `Forecast total: ${row.forecastKg} kg`,
        row.cust !== "BMKR" && region === "BMKR" && `Ordering cust: ${row.cust}`,
      ]
        .filter(Boolean)
        .join("; "),
      updatedAt: new Date().toISOString(),
    });
  }
  return items;
}

const source = process.argv[2] || DEFAULT_SOURCE;
const wb = XLSX.readFile(source);
const incoming = parseWorkbook(wb);

const existing = JSON.parse(readFileSync(OUT, "utf-8"));
const key = (i) => `${i.region}|${i.articleNo}`;
const map = new Map(existing.map((i) => [key(i), i]));

let added = 0;
let updated = 0;
for (const item of incoming) {
  const k = key(item);
  if (map.has(k)) {
    map.set(k, { ...map.get(k), ...item, id: map.get(k).id });
    updated++;
  } else {
    map.set(k, item);
    added++;
  }
}

const merged = [...map.values()];
writeFileSync(OUT, JSON.stringify(merged, null, 2));
console.log(`BMKR ordering import from: ${source}`);
console.log(`  Parsed: ${incoming.length} rows`);
console.log(`  Added: ${added}, Updated: ${updated}`);
console.log(`  Total inventory: ${merged.length}`);
incoming.forEach((i) =>
  console.log(`  - ${i.region} ${i.articleNo}: ${i.quantity} ${i.unit}`)
);
