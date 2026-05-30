import type { InventoryItem, Region } from "./types";
import { deriveMinStock } from "./types";
import {
  formatArticleCodeNotes,
  parseArticleCode,
} from "./article-code";

export const REGIONS: Region[] = ["BMAG", "BMCN", "BMKR"];

export const REGION_META: Record<
  Region,
  { label: string; country: string; description: string }
> = {
  BMAG: {
    label: "BMAG",
    country: "Switzerland",
    description: "BIBUS METALS AG — central stock",
  },
  BMCN: {
    label: "BMCN",
    country: "China",
    description: "BIBUS CN — China inventory",
  },
  BMKR: {
    label: "BMKR",
    country: "Korea",
    description: "BIBUS Korea — ordering & branch demand",
  },
};

/** Infer region from legacy notes/location when field is missing */
export function resolveRegion(item: Partial<InventoryItem>): Region {
  if (item.region === "BMAG" || item.region === "BMCN" || item.region === "BMKR") {
    return item.region;
  }
  const notes = String(item.notes ?? "");
  if (notes.includes("Source: BMCN") || item.location === "BMCN") return "BMCN";
  if (notes.includes("Source: BMKR") || notes.includes("BMKR Ordering")) {
    return "BMKR";
  }
  if (notes.includes("Source: BMAG")) return "BMAG";
  return "BMAG";
}

function applyArticleCodeForm(item: InventoryItem): InventoryItem {
  const parsed = parseArticleCode(item.articleNo);
  if (!parsed.formCode && !parsed.suffixCode) return item;

  const codeNote = formatArticleCodeNotes(parsed);
  const notes = item.notes.includes("Code: ")
    ? item.notes.replace(/Code: [^;]+(; )?/g, "").replace(/Suffix: [^;]+(; )?/g, "").trim()
    : item.notes;
  const mergedNotes = [codeNote, notes].filter(Boolean).join("; ").replace(/^; /, "");

  return {
    ...item,
    productForm: parsed.productForm,
    notes: mergedNotes,
  };
}

export function normalizeItem(item: InventoryItem): InventoryItem {
  const base = applyArticleCodeForm({ ...item, region: resolveRegion(item) });
  const minStock =
    base.minStock > 0 ? base.minStock : deriveMinStock(base);
  return { ...base, minStock };
}

export function normalizeInventory(items: InventoryItem[]): InventoryItem[] {
  return items.map(normalizeItem);
}
