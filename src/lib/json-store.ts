import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { getDataDir, getInventoryPath, getMovementsPath } from "./data-path";

const KEYS = {
  inventory: "scp:inventory",
  movements: "scp:movements",
} as const;

type StoreFile = keyof typeof KEYS;

function redisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function isRedisStorage(): boolean {
  return redisClient() != null;
}

export function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

function bundledPath(filename: string): string {
  return path.join(process.cwd(), "data", filename);
}

async function readBundled(filename: string): Promise<string> {
  return fs.readFile(bundledPath(filename), "utf-8");
}

async function readFs(file: StoreFile): Promise<string> {
  const filePath = file === "inventory" ? getInventoryPath() : getMovementsPath();
  await fs.mkdir(getDataDir(), { recursive: true });
  try {
    const stat = await fs.stat(filePath);
    if (stat.size > 10) return fs.readFile(filePath, "utf-8");
  } catch {
    /* seed below */
  }
  const seedName = file === "inventory" ? "inventory.json" : "movements.json";
  const raw = await readBundled(seedName);
  await fs.writeFile(filePath, raw, "utf-8");
  return raw;
}

async function writeFs(file: StoreFile, raw: string): Promise<void> {
  const filePath = file === "inventory" ? getInventoryPath() : getMovementsPath();
  await fs.mkdir(getDataDir(), { recursive: true });
  await fs.writeFile(filePath, raw, "utf-8");
}

async function readRedis(file: StoreFile): Promise<string> {
  const redis = redisClient()!;
  const key = KEYS[file];
  const data = await redis.get<unknown>(key);
  if (data != null) {
    return typeof data === "string" ? data : JSON.stringify(data);
  }
  const seedName = file === "inventory" ? "inventory.json" : "movements.json";
  const raw = await readBundled(seedName);
  await redis.set(key, JSON.parse(raw));
  return raw;
}

async function writeRedis(file: StoreFile, raw: string): Promise<void> {
  const redis = redisClient()!;
  await redis.set(KEYS[file], JSON.parse(raw));
}

export async function readJsonStore(file: StoreFile): Promise<string> {
  if (isRedisStorage()) return readRedis(file);
  if (isVercelRuntime()) {
    throw new Error(
      "Redis is required on Vercel. Add Upstash Redis from Vercel Storage / Marketplace and redeploy."
    );
  }
  return readFs(file);
}

export async function writeJsonStore(file: StoreFile, raw: string): Promise<void> {
  if (isRedisStorage()) return writeRedis(file, raw);
  if (isVercelRuntime()) {
    throw new Error(
      "Redis is required on Vercel. Add Upstash Redis from Vercel Storage / Marketplace and redeploy."
    );
  }
  return writeFs(file, raw);
}
