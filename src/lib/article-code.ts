import type { ProductForm } from "./types";

/** AXAPTA 2-letter form codes embedded in article numbers (e.g. 000KBA004.75C) */
export const ARTICLE_FORM_CODES: Record<string, ProductForm> = {
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

/** Single-letter suffix at end of article code (after dimensions) */
export const ARTICLE_SUFFIX_CODES: Record<string, ProductForm> = {
  C: "coil",
};

const CODE_PATTERN = new RegExp(
  `(${Object.keys(ARTICLE_FORM_CODES).join("|")})(?=\\d)`,
  "i"
);

export interface ParsedArticleCode {
  baseCode: string;
  formCode: string | null;
  formLabel: ProductForm | null;
  suffixCode: string | null;
  suffixLabel: ProductForm | null;
  productForm: ProductForm;
}

function resolveProductForm(
  formLabel: ProductForm | null,
  suffixLabel: ProductForm | null
): ProductForm {
  if (formLabel) return formLabel;
  if (suffixLabel) return suffixLabel;
  return "other";
}

/** Parse AXAPTA article code — e.g. 000KBA004.75C → BA=bar, suffix C=coil */
export function parseArticleCode(articleNo: string): ParsedArticleCode {
  const baseCode = articleNo.split(" · ")[0].trim().toUpperCase();

  let suffixCode: string | null = null;
  let suffixLabel: ProductForm | null = null;
  const suffixMatch = baseCode.match(/([0-9.]+)([A-Z])$/);
  if (suffixMatch) {
    const letter = suffixMatch[2];
    if (ARTICLE_SUFFIX_CODES[letter]) {
      suffixCode = letter;
      suffixLabel = ARTICLE_SUFFIX_CODES[letter];
    }
  }

  const formMatch = baseCode.match(CODE_PATTERN);
  const formCode = formMatch ? formMatch[1].toUpperCase() : null;
  const formLabel = formCode ? ARTICLE_FORM_CODES[formCode] ?? null : null;
  const productForm = resolveProductForm(formLabel, suffixLabel);

  return {
    baseCode,
    formCode,
    formLabel,
    suffixCode,
    suffixLabel,
    productForm,
  };
}

export function formatArticleCodeNotes(parsed: ParsedArticleCode): string {
  const parts: string[] = [];
  if (parsed.formCode && parsed.formLabel) {
    parts.push(`Code: ${parsed.formCode} (${parsed.formLabel})`);
  }
  if (parsed.suffixCode && parsed.suffixLabel) {
    parts.push(`Suffix: ${parsed.suffixCode} (${parsed.suffixLabel})`);
  }
  return parts.join("; ");
}
