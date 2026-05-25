import * as XLSX from "xlsx";
import type { InventoryItem, ProductForm } from "./types";
import { defaultUnitForForm } from "./types";
import { generateId } from "./storage";
import {
  formatArticleCodeNotes,
  parseArticleCode,
} from "./article-code";

function formatDimensions(s1: unknown, s2: unknown, s3: unknown): string {
  const parts: string[] = [];
  if (Number(s1)) parts.push(`D/THK ${s1}`);
  if (Number(s2)) parts.push(`W ${s2}`);
  if (Number(s3)) parts.push(`L ${s3}`);
  return parts.join(" · ") || "—";
}

function uniqueArticleNo(
  article: string,
  heat: string,
  location: string,
  s1: unknown,
  s2: unknown,
  s3: unknown
): string {
  const base = article.trim();
  const heatPart = heat.trim();
  if (heatPart) return `${base} · ${heatPart}`;
  const loc = location.trim();
  const dim = [s1, s2, s3].filter((x) => Number(x)).join("x");
  if (loc || dim) return `${base} · ${loc}${dim ? ` · ${dim}` : ""}`;
  return base;
}

function parseItemName(name: string) {
  let material = "";
  let alloy = "";
  let productForm: ProductForm = "other";

  if (/titanium/i.test(name)) material = "Titanium";
  else if (/nickel|inconel|monel|hastelloy/i.test(name)) material = "Nickel";
  else if (/stainless|316|304|17-4/i.test(name)) material = "Stainless Steel";
  else if (/steel/i.test(name)) material = "Steel";

  const gradeMatch = name.match(
    /Gr\.?\s*[\d\w.-]+|Ti-[\d\w.-]+|Inconel\s*\d+|316L|625|718/i
  );
  if (gradeMatch) alloy = gradeMatch[0];

  if (/round bar|\bbar\b/i.test(name)) productForm = "bar";
  else if (/\bstrip\b/i.test(name)) productForm = "strip";
  else if (/sheet|plate|\bflat\b/i.test(name)) productForm = "flat";
  else if (/tube|pipe/i.test(name)) productForm = "tube";
  else if (/wire|welding|electrode/i.test(name)) productForm = "electrodes";

  return { material, alloy, productForm };
}

function parseBMAGRows(rows: unknown[][]): InventoryItem[] {
  const items: InventoryItem[] = [];
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    const article = r[0];
    if (!article || String(article).includes("Article code")) continue;

    const location = String(r[1] ?? "").trim();
    const heat = String(r[2] ?? "").trim();
    const articleStr = String(article);
    const parsed = parseArticleCode(articleStr);
    const articleNo = uniqueArticleNo(
      articleStr,
      heat,
      location,
      r[3],
      r[4],
      r[5]
    );

    items.push({
      id: generateId(),
      region: "BMAG",
      articleNo,
      material: "",
      alloy: "",
      productForm: parsed.productForm,
      dimensions: formatDimensions(r[3], r[4], r[5]),
      quantity: Number(String(r[6] ?? "").replace(/,/g, "")) || 0,
      unit: defaultUnitForForm(parsed.productForm),
      location: location || "BMAG",
      minStock: 0,
      supplier: "BIBUS METALS AG",
      notes: [
        heat && `Heat: ${heat}`,
        formatArticleCodeNotes(parsed),
        "Source: BMAG",
      ]
        .filter(Boolean)
        .join("; "),
      updatedAt: new Date().toISOString(),
    });
  }
  return items;
}

function parseBMCNRows(rows: unknown[][]): InventoryItem[] {
  const items: InventoryItem[] = [];
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i] as unknown[];
    const code = r[0];
    if (!code || String(code).includes("Item Code")) continue;

    const name = String(r[1] ?? "");
    const nameParsed = parseItemName(name);
    const codeStr = String(code).trim();
    const codeParsed = parseArticleCode(codeStr);
    const mill = String(r[4] ?? "").trim();
    const productForm = codeParsed.formCode
      ? codeParsed.productForm
      : nameParsed.productForm;

    items.push({
      id: generateId(),
      region: "BMCN",
      articleNo: codeStr,
      material: nameParsed.material,
      alloy: nameParsed.alloy,
      productForm,
      dimensions: name.match(/\[[^\]]+\]/)?.[0] ?? "",
      quantity: Number(String(r[2] ?? "").replace(/,/g, "")) || 0,
      unit: String(r[3] ?? defaultUnitForForm(productForm)).trim(),
      location: "BMCN",
      minStock: 0,
      supplier: mill || "BIBUS CN",
      notes: [
        name && `Spec: ${name}`,
        formatArticleCodeNotes(codeParsed),
        mill && `Mill: ${mill}`,
        "Source: BMCN",
      ]
        .filter(Boolean)
        .join("; "),
      updatedAt: new Date().toISOString(),
    });
  }
  return items;
}

export function isCentralizationWorkbook(workbook: XLSX.WorkBook): boolean {
  const bmag = workbook.Sheets["BMAG"];
  if (!bmag) return false;
  const rows = XLSX.utils.sheet_to_json(bmag, { header: 1, defval: "" }) as unknown[][];
  const header = rows[1] as unknown[] | undefined;
  return String(header?.[0] ?? "").includes("Article code");
}

export function parseCentralizationWorkbook(
  workbook: XLSX.WorkBook
): InventoryItem[] {
  const items: InventoryItem[] = [];
  if (workbook.Sheets["BMAG"]) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets["BMAG"], {
      header: 1,
      defval: "",
    }) as unknown[][];
    items.push(...parseBMAGRows(rows));
  }
  if (workbook.Sheets["BMCN"]) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets["BMCN"], {
      header: 1,
      defval: "",
    }) as unknown[][];
    items.push(...parseBMCNRows(rows));
  }
  return items;
}
