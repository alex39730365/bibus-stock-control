import type {
  ApiResponse,
  ImportResult,
  InventoryFilter,
  InventoryItem,
  InventoryStats,
  StockMovement,
} from "./types";

const BASE = "/api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  return res.json() as Promise<ApiResponse<T>>;
}

export type InventoryQuery = InventoryFilter & {
  page?: number;
  limit?: number;
};

export async function fetchInventory(
  filter?: InventoryQuery
): Promise<ApiResponse<InventoryItem[]>> {
  const params = new URLSearchParams();
  if (filter?.search) params.set("search", filter.search);
  if (filter?.region) params.set("region", filter.region);
  if (filter?.productForm) params.set("productForm", filter.productForm);
  if (filter?.location) params.set("location", filter.location);
  if (filter?.status) params.set("status", filter.status);
  if (filter?.page) params.set("page", String(filter.page));
  if (filter?.limit) params.set("limit", String(filter.limit));
  const q = params.toString();
  return request<InventoryItem[]>(`/inventory${q ? `?${q}` : ""}`);
}

export async function fetchStats(
  region?: InventoryFilter["region"]
): Promise<ApiResponse<InventoryStats>> {
  const q = region ? `?region=${region}` : "";
  return request<InventoryStats>(`/inventory/stats${q}`);
}

export async function fetchMovements(
  limit = 100
): Promise<ApiResponse<StockMovement[]>> {
  return request<StockMovement[]>(`/movements?limit=${limit}`);
}

export function getExportUrl(region?: InventoryFilter["region"]): string {
  return region ? `${BASE}/export?region=${region}` : `${BASE}/export`;
}

export async function createItem(
  item: Omit<InventoryItem, "id" | "updatedAt">
): Promise<ApiResponse<InventoryItem>> {
  return request<InventoryItem>("/inventory", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function updateItem(
  id: string,
  item: Partial<InventoryItem>
): Promise<ApiResponse<InventoryItem>> {
  return request<InventoryItem>(`/inventory/${id}`, {
    method: "PUT",
    body: JSON.stringify(item),
  });
}

export async function deleteItem(id: string): Promise<ApiResponse<void>> {
  return request<void>(`/inventory/${id}`, { method: "DELETE" });
}

export async function importExcel(
  file: File,
  mode: "merge" | "replace"
): Promise<ApiResponse<ImportResult>> {
  const form = new FormData();
  form.append("file", file);
  form.append("mode", mode);
  const res = await fetch(`${BASE}/import`, { method: "POST", body: form });
  return res.json() as Promise<ApiResponse<ImportResult>>;
}

export function getTemplateUrl(): string {
  return `${BASE}/export?template=1`;
}
