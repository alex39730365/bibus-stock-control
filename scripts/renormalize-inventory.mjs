/**
 * Re-apply article code + minStock rules to data/inventory.json (local seed file).
 * Run: node scripts/renormalize-inventory.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Inline minimal mirror of article-code + types logic for Node script
const ARTICLE_FORM_CODES = {
  BA: "bar", CY: "cylinder", EL: "electrodes", FA: "fasteners", FG: "flange",
  FI: "fittings", FL: "flat", FM: "filler metal", TU: "tube", ST: "strip", SQ: "square",
};
const ARTICLE_SUFFIX_CODES = { C: "coil" };
const CODE_PATTERN = new RegExp(`(${Object.keys(ARTICLE_FORM_CODES).join("|")})(?=\\d)`, "i");

function parseArticleCode(articleNo) {
  const baseCode = articleNo.split(" · ")[0].trim().toUpperCase();
  let suffixLabel = null;
  const suffixMatch = baseCode.match(/([0-9.]+)([A-Z])$/);
  if (suffixMatch && ARTICLE_SUFFIX_CODES[suffixMatch[2]]) {
    suffixLabel = ARTICLE_SUFFIX_CODES[suffixMatch[2]];
  }
  const formMatch = baseCode.match(CODE_PATTERN);
  const formCode = formMatch ? formMatch[1].toUpperCase() : null;
  const formLabel = formCode ? ARTICLE_FORM_CODES[formCode] ?? null : null;
  const productForm = suffixLabel || formLabel || "other";
  return { productForm, formCode, suffixCode: suffixMatch?.[2] ?? null, formLabel, suffixLabel };
}

function deriveMinStock(quantity, minStock) {
  if (minStock > 0) return minStock;
  if (quantity <= 0) return 0;
  return Math.max(1, Math.ceil(quantity * 0.3));
}

function formatNotes(parsed, notes) {
  const parts = [];
  if (parsed.formCode && parsed.formLabel) parts.push(`Code: ${parsed.formCode} (${parsed.formLabel})`);
  if (parsed.suffixCode && parsed.suffixLabel) parts.push(`Suffix: ${parsed.suffixCode} (${parsed.suffixLabel})`);
  const codeNote = parts.join("; ");
  const cleaned = notes
    .replace(/Code: [^;]+(; )?/g, "")
    .replace(/Suffix: [^;]+(; )?/g, "")
    .trim();
  return [codeNote, cleaned].filter(Boolean).join("; ").replace(/^; /, "");
}

const file = path.join(root, "data", "inventory.json");
const items = JSON.parse(readFileSync(file, "utf-8"));
let coil = 0;
let low = 0;
let out = 0;

for (const item of items) {
  const parsed = parseArticleCode(item.articleNo);
  item.productForm = parsed.productForm;
  if (parsed.formCode || parsed.suffixCode) {
    item.notes = formatNotes(parsed, item.notes);
  }
  item.minStock = deriveMinStock(item.quantity, item.minStock);
  if (item.quantity <= 0) out++;
  else if (item.quantity <= item.minStock) low++;
  if (item.productForm === "coil") coil++;
}

writeFileSync(file, JSON.stringify(items, null, 2), "utf-8");
console.log(`Updated ${items.length} items — coil: ${coil}, low: ${low}, out: ${out}`);
