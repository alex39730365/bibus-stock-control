/**
 * Quick check: I/C 905310 roll-forward vs Excel reference.
 * Run: node scripts/verify-psi.mjs
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load compiled would need build; inline mirror of core logic for CI-less check
const MONTH_COUNT = 14;

function isActualPosted(value) {
  return value !== null && value !== undefined;
}

function customerDemandForMonth(customer, monthIndex) {
  const actual = customer.actual[monthIndex];
  if (isActualPosted(actual)) return actual;
  return 0;
}

function totalDemandForMonth(customers, monthIndex) {
  return customers.reduce(
    (sum, c) => sum + customerDemandForMonth(c, monthIndex),
    0
  );
}

function avgForwardTotalDemand(totalDemand, monthIndex, forwardMonths = 3) {
  const forward = [];
  for (let j = 1; j <= forwardMonths; j++) {
    const idx = monthIndex + j;
    if (idx < MONTH_COUNT) forward.push(totalDemand[idx] ?? 0);
  }
  if (forward.length === forwardMonths) {
    return forward.reduce((a, b) => a + b, 0) / forwardMonths;
  }
  if (forward.length > 0) {
    return forward.reduce((a, b) => a + b, 0) / forward.length;
  }
  const trailing = totalDemand.slice(Math.max(0, MONTH_COUNT - forwardMonths));
  if (trailing.length > 0) {
    return trailing.reduce((a, b) => a + b, 0) / trailing.length;
  }
  const current = totalDemand[monthIndex] ?? 0;
  return current !== 0 ? current : 1;
}

function computeItemTotals(source) {
  const beginningInventory = [];
  const endingInventory = [];
  const monthsOfSupply = [];
  const totalDemand = [];
  for (let i = 0; i < MONTH_COUNT; i++) {
    totalDemand.push(totalDemandForMonth(source.customers, i));
  }
  for (let i = 0; i < MONTH_COUNT; i++) {
    const beginning =
      i === 0 ? source.initialInventory : endingInventory[i - 1];
    beginningInventory.push(beginning);
    const receipt = source.scheduleReceipt[i] ?? 0;
    const demand = totalDemand[i];
    const ending = beginning + receipt - demand;
    endingInventory.push(ending);
    monthsOfSupply.push(ending / avgForwardTotalDemand(totalDemand, i));
  }
  return { beginningInventory, endingInventory, monthsOfSupply, totalDemand };
}

const { PSI_MOCK_SOURCES } = require("../src/lib/psi-mock-data.ts");
const item = PSI_MOCK_SOURCES[0];
const t = computeItemTotals(item);

const checks = [
  ["Apr ending", t.endingInventory[0], 6950],
  ["May ending", t.endingInventory[1], 4445],
  ["Apr demand", t.totalDemand[0], 3050],
  ["May demand", t.totalDemand[1], 5505],
];

let failed = 0;
for (const [label, got, want] of checks) {
  const ok = got === want;
  console.log(ok ? "OK" : "FAIL", label, got, want === got ? "" : `(expected ${want})`);
  if (!ok) failed++;
}

console.log(
  "Apr MoS",
  t.monthsOfSupply[0].toFixed(2),
  "(Excel UI often shows ~1.46 in May column)"
);
console.log(
  "May MoS",
  t.monthsOfSupply[1].toFixed(2),
  "(Excel Jun column ~0.09)"
);

process.exit(failed ? 1 : 0);
