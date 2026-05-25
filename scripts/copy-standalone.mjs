import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

if (!existsSync(path.join(standalone, "server.js"))) {
  console.error("[postbuild] Missing .next/standalone/server.js — run next build first");
  process.exit(1);
}

function copyDir(src, dest) {
  if (!existsSync(src)) {
    console.warn(`[postbuild] Skip missing: ${src}`);
    return;
  }
  mkdirSync(path.dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[postbuild] ${src} → ${dest}`);
}

copyDir(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"));
copyDir(path.join(root, "public"), path.join(standalone, "public"));
copyDir(path.join(root, "data"), path.join(standalone, "data"));

console.log("[postbuild] Standalone bundle ready");
