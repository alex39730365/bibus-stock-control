import type { InventoryItem, MovementType, StockMovement } from "./types";
import { getItemById, upsertItem } from "./storage";
import { generateId } from "./storage";
import { readJsonStore, writeJsonStore } from "./json-store";

export async function readMovements(): Promise<StockMovement[]> {
  const raw = await readJsonStore("movements");
  const items = JSON.parse(raw) as StockMovement[];
  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

async function writeMovements(items: StockMovement[]): Promise<void> {
  await writeJsonStore("movements", JSON.stringify(items, null, 2));
}

export async function recordMovement(params: {
  itemId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  operator: string;
}): Promise<{ item: InventoryItem; movement: StockMovement }> {
  const item = await getItemById(params.itemId);
  if (!item) throw new Error("Item not found");

  const before = item.quantity;
  let after = before;

  if (params.type === "in") {
    after = before + params.quantity;
  } else if (params.type === "out") {
    after = Math.max(0, before - params.quantity);
  } else {
    after = Math.max(0, params.quantity);
  }

  const delta = after - before;
  const updated: InventoryItem = {
    ...item,
    quantity: after,
    updatedAt: new Date().toISOString(),
  };
  await upsertItem(updated);

  const movement: StockMovement = {
    id: generateId().replace("inv_", "mov_"),
    itemId: item.id,
    articleNo: item.articleNo,
    region: item.region,
    type: params.type,
    quantityBefore: before,
    quantityAfter: after,
    delta,
    unit: item.unit,
    reason: params.reason.trim() || "—",
    operator: params.operator,
    createdAt: new Date().toISOString(),
  };

  const all = await readMovements();
  all.unshift(movement);
  await writeMovements(all.slice(0, 5000));

  return { item: updated, movement };
}
