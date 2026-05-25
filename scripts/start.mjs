import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT) || 3000;
/** Railway v2: set HOSTNAME=:: if healthchecks fail; default 0.0.0.0 */
const host = process.env.HOSTNAME || "0.0.0.0";

if (!Number.isFinite(port) || port < 1 || port > 65535) {
  console.error(`[start] Invalid PORT="${process.env.PORT}"`);
  process.exit(1);
}

const nextBin = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

console.log(
  `[start] next start -H ${host} -p ${port} (PORT env=${process.env.PORT ?? "unset"})`
);

const child = spawn(
  process.execPath,
  [nextBin, "start", "-H", host, "-p", String(port)],
  { stdio: "inherit", env: process.env }
);

child.on("exit", (code) => process.exit(code ?? 1));
