import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const standaloneDir = path.join(process.cwd(), ".next", "standalone");
const serverJs = path.join(standaloneDir, "server.js");

if (!existsSync(serverJs)) {
  console.error(`[start] Missing ${serverJs} — run npm run build first`);
  process.exit(1);
}

const port = Number(process.env.PORT) || 3000;
process.env.PORT = String(port);
process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

console.log(
  `[start] cwd=${standaloneDir} PORT=${port} HOSTNAME=${process.env.HOSTNAME}`
);

const child = spawn(process.execPath, ["server.js"], {
  cwd: standaloneDir,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 1));
