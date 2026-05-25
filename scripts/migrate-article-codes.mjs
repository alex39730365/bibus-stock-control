import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data", "inventory.json");

const ARTICLE_FORM_CODES = {
  BA: "bar",
  CY: "cylinder",
  EL: "electrodes",
  FA: "fasteners",
  FG: "flange",
  FI: "fittings",
  FL: "flat",
  FM: "filler metal",
  TU: "tube",
  ST: "strip",
  SQ: "square",
};
const ARTICLE_SUFFIX_CODES = { C: "coil" };
const CODE_PATTERN = new RegExp(
  `(${Object.keys(ARTICLE_FORM_CODES).join("|")})(?=\\d)`,
  "i"
);

const LEGACY = {
  "Bar/Wire": "bar",
  "Sheet/Plate": "flat",
  "Tube/Pipe": "tube",
  Welding: "electrodes",
  Other: "other",
};

function parseArticleCode(articleNo) {
  const baseCode = articleNo.split(" · ")[0].trim().toUpperCase();
  let suffixCode = null;
  let suffixLabel = null;
  const suffixMatch = baseCode.match(/([0-9.]+)([A-Z])$/);
  if (suffixMatch && ARTICLE_SUFFIX_CODES[suffixMatch[2]]) {
    suffixCode = suffixMatch[2];
    suffixLabel = ARTICLE_SUFFIX_CODES[suffixCode];
  }
  const formMatch = baseCode.match(CODE_PATTERN);
  const formCode = formMatch ? formMatch[1].toUpperCase() : null;
  const formLabel = formCode ? ARTICLE_FORM_CODES[formCode] : null;
  const productForm = formLabel || suffixLabel || null;
  return { formCode, formLabel, suffixCode, suffixLabel, productForm };
}

function formatNotes(parsed) {
  const parts = [];
  if (parsed.formCode && parsed.formLabel)
    parts.push(`Code: ${parsed.formCode} (${parsed.formLabel})`);
  if (parsed.suffixCode && parsed.suffixLabel)
    parts.push(`Suffix: ${parsed.suffixCode} (${parsed.suffixLabel})`);
  return parts.join("; ");
}

const items = JSON.parse(readFileSync(DATA, "utf8"));
const out = items.map((item) => {
  const parsed = parseArticleCode(item.articleNo);
  let productForm =
    parsed.productForm || LEGACY[item.productForm] || item.productForm || "other";
  if (LEGACY[productForm]) productForm = LEGACY[productForm];

  let notes = item.notes || "";
  notes = notes
    .replace(/Code: [^;]+(; )?/g, "")
    .replace(/Suffix: [^;]+(; )?/g, "")
    .replace(/Form: [^;]+(; )?/g, "")
    .trim();
  const codeNote = formatNotes(parsed);
  notes = [codeNote, notes].filter(Boolean).join("; ");

  return {
    ...item,
    productForm,
    unit: productForm === "tube" ? "m" : item.unit === "m" && productForm !== "tube" ? "kg" : item.unit || "kg",
    notes,
  };
});

writeFileSync(DATA, JSON.stringify(out, null, 2));
const forms = {};
out.forEach((i) => (forms[i.productForm] = (forms[i.productForm] || 0) + 1));
console.log("Migrated", out.length, "items. Forms:", forms);
