/** Inventory item — BIBUS METALS high-performance materials */

/** AXAPTA / stock form labels (kept as-is: bar, tube, coil, …) */
export type ProductForm =
  | "bar"
  | "cylinder"
  | "electrodes"
  | "fasteners"
  | "flange"
  | "fittings"
  | "flat"
  | "filler metal"
  | "tube"
  | "strip"
  | "square"
  | "coil"
  | "other";

export const PRODUCT_FORMS: ProductForm[] = [
  "bar",
  "cylinder",
  "tube",
  "flat",
  "strip",
  "square",
  "coil",
  "electrodes",
  "filler metal",
  "fasteners",
  "flange",
  "fittings",
  "other",
];

export type StockStatus = "ok" | "low" | "out";

/** BMAG = Switzerland (AG), BMCN = China (CN) */
export type Region = "BMAG" | "BMCN";

export interface InventoryItem {
  id: string;
  region: Region;
  articleNo: string;
  material: string;
  alloy: string;
  productForm: ProductForm;
  dimensions: string;
  quantity: number;
  unit: string;
  location: string;
  minStock: number;
  supplier: string;
  notes: string;
  updatedAt: string;
}

export interface InventoryStats {
  totalItems: number;
  totalQuantity: number;
  lowStockCount: number;
  outOfStockCount: number;
  byForm: Record<string, number>;
  byLocation: Record<string, number>;
  byRegion: Record<Region, number>;
}

export type MovementType = "in" | "out" | "adjust";

export interface StockMovement {
  id: string;
  itemId: string;
  articleNo: string;
  region: Region;
  type: MovementType;
  quantityBefore: number;
  quantityAfter: number;
  delta: number;
  unit: string;
  reason: string;
  operator: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    imported?: number;
    updated?: number;
    skipped?: number;
  };
}

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export type InventoryFilter = {
  search?: string;
  region?: Region | "";
  productForm?: ProductForm | "";
  location?: string;
  /** `alert` = low + out (dashboard Stock Alerts) */
  status?: StockStatus | "alert" | "";
};

/** Reorder point when ERP min stock is missing (centralization import uses 0) */
export function deriveMinStock(item: InventoryItem): number {
  if (item.minStock > 0) return item.minStock;
  if (item.quantity <= 0) return 0;
  return Math.max(1, Math.ceil(item.quantity * 0.3));
}

export function getStockStatus(item: InventoryItem): StockStatus {
  if (item.quantity <= 0) return "out";
  const min = deriveMinStock(item);
  if (min > 0 && item.quantity <= min) return "low";
  return "ok";
}

/** tube stock is measured in meters */
export function defaultUnitForForm(form: ProductForm): string {
  return form === "tube" ? "m" : "kg";
}
