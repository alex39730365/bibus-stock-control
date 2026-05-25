import { promises as fs } from "fs";
import path from "path";
import { getDataDir, getSeedDataDir } from "./data-path";

let seedPromise: Promise<void> | null = null;

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

/** Copy bundled inventory/movements into DATA_PATH once (non-blocking for HTTP server). */
export function ensureSeedData(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        await copySeedIfMissing("inventory.json");
        await copySeedIfMissing("movements.json");
      } catch (err) {
        console.error("[data] Seed failed:", err);
      }
    })();
  }
  return seedPromise;
}
