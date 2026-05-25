import { promises as fs } from "fs";
import type { InventoryItem, InventoryStats, Region } from "./types";
import { getStockStatus } from "./types";
import { normalizeInventory, resolveRegion } from "./regions";
import { getDataDir, getInventoryPath } from "./data-path";

function inventoryFile(): string {
  return getInventoryPath();
}

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(getDataDir(), { recursive: true });
  const file = inventoryFile();
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, "[]", "utf-8");
  }
}

export async function readInventory(): Promise<InventoryItem[]> {
  await ensureDataFile();
  const raw = await fs.readFile(inventoryFile(), "utf-8");
  const items = JSON.parse(raw) as InventoryItem[];
  return normalizeInventory(items);
}

export async function writeInventory(items: InventoryItem[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(inventoryFile(), JSON.stringify(items, null, 2), "utf-8");
}

export async function getItemById(id: string): Promise<InventoryItem | undefined> {
  const items = await readInventory();
  return items.find((i) => i.id === id);
}

export async function getItemByArticleNo(
  articleNo: string
): Promise<InventoryItem | undefined> {
  const items = await readInventory();
  return items.find(
    (i) => i.articleNo.toLowerCase() === articleNo.toLowerCase()
  );
}

export async function upsertItem(item: InventoryItem): Promise<InventoryItem> {
  const items = await readInventory();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx] = item;
  } else {
    items.push(item);
  }
  await writeInventory(items);
  return item;
}

export async function deleteItem(id: string): Promise<boolean> {
  const items = await readInventory();
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) return false;
  await writeInventory(filtered);
  return true;
}

export async function bulkUpsert(
  newItems: InventoryItem[],
  mode: "merge" | "replace"
): Promise<{ imported: number; updated: number; skipped: number }> {
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  if (mode === "replace") {
    await writeInventory(newItems);
    return { imported: newItems.length, updated: 0, skipped: 0 };
  }

  const existing = await readInventory();
  const map = new Map(existing.map((i) => [i.articleNo.toLowerCase(), i]));

  for (const item of newItems) {
    const key = item.articleNo.toLowerCase();
    const prev = map.get(key);
    if (prev) {
      map.set(key, { ...item, id: prev.id, updatedAt: new Date().toISOString() });
      updated++;
    } else {
      map.set(key, item);
      imported++;
    }
  }

  const merged = Array.from(map.values());
  skipped = newItems.length - imported - updated;
  if (skipped < 0) skipped = 0;

  await writeInventory(merged);
  return { imported, updated, skipped };
}

export function computeStats(items: InventoryItem[]): InventoryStats {
  const byForm: Record<string, number> = {};
  const byLocation: Record<string, number> = {};
  const byRegion: Record<Region, number> = { BMAG: 0, BMCN: 0 };
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalQuantity = 0;

  for (const item of items) {
    const region = resolveRegion(item);
    totalQuantity += item.quantity;
    byForm[item.productForm] = (byForm[item.productForm] ?? 0) + 1;
    byLocation[item.location] = (byLocation[item.location] ?? 0) + 1;
    byRegion[region] = (byRegion[region] ?? 0) + 1;
    const status = getStockStatus(item);
    if (status === "low") lowStockCount++;
    if (status === "out") outOfStockCount++;
  }

  return {
    totalItems: items.length,
    totalQuantity,
    lowStockCount,
    outOfStockCount,
    byForm,
    byLocation,
    byRegion,
  };
}

export function generateId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
