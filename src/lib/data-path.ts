import path from "path";

/** Persistent data directory (Railway volume: set DATA_PATH=/data) */
export function getDataDir(): string {
  const base = process.env.DATA_PATH?.trim();
  if (base) return path.isAbsolute(base) ? base : path.join(process.cwd(), base);
  return path.join(process.cwd(), "data");
}

export function getInventoryPath(): string {
  return path.join(getDataDir(), "inventory.json");
}

export function getMovementsPath(): string {
  return path.join(getDataDir(), "movements.json");
}

/** Bundled seed files shipped with the app (repo data/) */
export function getSeedDataDir(): string {
  return path.join(process.cwd(), "data");
}
