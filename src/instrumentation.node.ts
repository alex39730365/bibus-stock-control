import { promises as fs } from "fs";
import path from "path";
import { getDataDir, getInventoryPath, getMovementsPath, getSeedDataDir } from "@/lib/data-path";

async function copySeedIfMissing(filename: string): Promise<void> {
  const target = path.join(getDataDir(), filename);
  try {
    const stat = await fs.stat(target);
    if (stat.size > 10) return;
  } catch {
    /* missing */
  }

  const seed = path.join(getSeedDataDir(), filename);
  try {
    await fs.access(seed);
    await fs.mkdir(getDataDir(), { recursive: true });
    await fs.copyFile(seed, target);
    console.log(`[data] Seeded ${filename} → ${target}`);
  } catch {
    /* no bundled seed */
  }
}

export async function registerNode(): Promise<void> {
  await fs.mkdir(getDataDir(), { recursive: true });
  await copySeedIfMissing("inventory.json");
  await copySeedIfMissing("movements.json");
  console.log(`[data] Inventory: ${getInventoryPath()}`);
  console.log(`[data] Movements: ${getMovementsPath()}`);
}
