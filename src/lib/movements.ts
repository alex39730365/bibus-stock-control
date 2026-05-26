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

function qtyMatches(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.0001;
}

export async function cancelMovement(
  movementId: string,
  operator: string
): Promise<{ item: InventoryItem; movement: StockMovement }> {
  const all = await readMovements();
  const index = all.findIndex((m) => m.id === movementId);
  if (index === -1) throw new Error("Movement not found");

  const movement = all[index];
  if (movement.cancelledAt) throw new Error("Movement already cancelled");

  const item = await getItemById(movement.itemId);
  if (!item) throw new Error("Item no longer exists");

  if (!qtyMatches(item.quantity, movement.quantityAfter)) {
    throw new Error(
      "Current stock no longer matches this movement. Adjust stock manually or cancel newer movements first."
    );
  }

  const restored: InventoryItem = {
    ...item,
    quantity: movement.quantityBefore,
    updatedAt: new Date().toISOString(),
  };
  await upsertItem(restored);

  const cancelled: StockMovement = {
    ...movement,
    cancelledAt: new Date().toISOString(),
    cancelledBy: operator,
  };
  all[index] = cancelled;
  await writeMovements(all);

  return { item: restored, movement: cancelled };
}
