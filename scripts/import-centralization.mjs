import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SOURCE =
  process.argv[2] ||
  "c:\\Users\\alex3\\OneDrive\\문서\\카카오톡 받은 파일\\052526 stocks - centralization.xlsx";
const OUT = path.join(ROOT, "data", "inventory.json");

function generateId() {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function mapProductForm(form, code) {
  const f = String(form || "").toLowerCase().trim();
  const c = String(code || "").toUpperCase().trim();
  if (f === "bar" || c === "BA") return "Bar/Wire";
  if (f === "tube" || c === "TU") return "Tube/Pipe";
  if (
    f === "flat" ||
    f === "strip" ||
    f === "square" ||
    f === "coil" ||
    c === "ST" ||
    c === "SQ" ||
    c === "FL"
  )
    return "Sheet/Plate";
  if (
    f === "electrodes" ||
    f === "filler metal" ||
    f === "filler metal" ||
    c === "EL" ||
    c === "FM"
  )
    return "Welding";
  return "Other";
}

function formatDimensions(s1, s2, s3) {
  const parts = [];
  const n1 = Number(s1);
  const n2 = Number(s2);
  const n3 = Number(s3);
  if (n1) parts.push(`D/THK ${n1}`);
  if (n2) parts.push(`W ${n2}`);
  if (n3) parts.push(`L ${n3}`);
  return parts.join(" · ") || "—";
}

function uniqueArticleNo(article, heat, location, s1, s2, s3) {
  const base = String(article).trim();
  const heatPart = String(heat || "").trim();
  if (heatPart) return `${base} · ${heatPart}`;
  const loc = String(location || "").trim();
  const dim = [s1, s2, s3].filter((x) => Number(x)).join("x");
  if (loc || dim) return `${base} · ${loc}${dim ? ` · ${dim}` : ""}`;
  return base;
}

function parseItemName(name) {
  const text = String(name || "");
  let material = "";
  let alloy = "";
  let productForm = "Other";

  if (/titanium/i.test(text)) material = "Titanium";
  else if (/nickel|inconel|monel|hastelloy/i.test(text)) material = "Nickel";
  else if (/stainless|316|304|17-4/i.test(text)) material = "Stainless Steel";
  else if (/steel/i.test(text)) material = "Steel";

  const gradeMatch = text.match(
    /Gr\.?\s*[\d\w.-]+|Ti-[\d\w.-]+|Inconel\s*\d+|316L|625|718/i
  );
  if (gradeMatch) alloy = gradeMatch[0];

  if (/round bar|bar/i.test(text)) productForm = "Bar/Wire";
  else if (/sheet|plate|strip/i.test(text)) productForm = "Sheet/Plate";
  else if (/tube|pipe/i.test(text)) productForm = "Tube/Pipe";
  else if (/wire|welding/i.test(text)) productForm = "Welding";

  return { material, alloy, productForm };
}

function parseBMAG(rows) {
  const items = [];
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    const article = r[0];
    if (!article || String(article).includes("Article code")) continue;

    const location = String(r[1] ?? "").trim();
    const heat = String(r[2] ?? "").trim();
    const s1 = r[3];
    const s2 = r[4];
    const s3 = r[5];
    const qty = Number(String(r[6] ?? "").replace(/,/g, ""));
    const prodCode = String(r[8] ?? "").trim();
    const prodForm = String(r[9] ?? "").trim();
    const form = mapProductForm(prodForm, prodCode);
    const unit = form === "Tube/Pipe" || prodForm === "tube" ? "m" : "kg";

    items.push({
      id: generateId(),
      region: "BMAG",
      articleNo: uniqueArticleNo(article, heat, location, s1, s2, s3),
      material: "",
      alloy: "",
      productForm: form,
      dimensions: formatDimensions(s1, s2, s3),
      quantity: Number.isFinite(qty) ? qty : 0,
      unit,
      location: location || "BMAG",
      minStock: 0,
      supplier: "BIBUS METALS AG",
      notes: [
        heat && `Heat: ${heat}`,
        prodCode && `Code: ${prodCode}`,
        prodForm && `Form: ${prodForm}`,
        `Source: BMAG`,
      ]
        .filter(Boolean)
        .join("; "),
      updatedAt: new Date().toISOString(),
    });
  }
  return items;
}

function parseBMCN(rows) {
  const items = [];
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    const code = r[0];
    if (!code || String(code).includes("Item Code")) continue;

    const name = String(r[1] ?? "");
    const qty = Number(String(r[2] ?? "").replace(/,/g, ""));
    const unit = String(r[3] ?? "kg").trim() || "kg";
    const mill = String(r[4] ?? "").trim();
    const parsed = parseItemName(name);

    items.push({
      id: generateId(),
      region: "BMCN",
      articleNo: String(code).trim(),
      material: parsed.material,
      alloy: parsed.alloy,
      productForm: parsed.productForm,
      dimensions: name.includes("[") ? name.match(/\[[^\]]+\]/)?.[0] ?? "" : "",
      quantity: Number.isFinite(qty) ? qty : 0,
      unit,
      location: "BMCN",
      minStock: 0,
      supplier: mill || "BIBUS CN",
      notes: [name && `Spec: ${name}`, mill && `Mill: ${mill}`, `Source: BMCN`]
        .filter(Boolean)
        .join("; "),
      updatedAt: new Date().toISOString(),
    });
  }
  return items;
}

const wb = XLSX.readFile(SOURCE);
const bmag = XLSX.utils.sheet_to_json(wb.Sheets["BMAG"], { header: 1, defval: "" });
const bmcn = XLSX.utils.sheet_to_json(wb.Sheets["BMCN"], { header: 1, defval: "" });

const items = [...parseBMAG(bmag), ...parseBMCN(bmcn)];

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(items, null, 2), "utf-8");

console.log(`Imported ${items.length} items from ${path.basename(SOURCE)}`);
console.log(`  BMAG: ${parseBMAG(bmag).length}`);
console.log(`  BMCN: ${parseBMCN(bmcn).length}`);
console.log(`Written to ${OUT}`);
