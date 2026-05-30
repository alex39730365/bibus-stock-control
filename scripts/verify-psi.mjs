/**
 * Roll-forward + totalDemand checks for I/C 905310 (Excel reference).
 * Uses the same module as the PSI dashboard — no duplicated logic, no totalForecast.
 *
 * Run: npm run verify:psi
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const {
  buildPsiItems,
  PSI_MOCK_SOURCES,
  PSI_MONTHS,
  PSI_905310_EXCEL_CHECKS,
} = require(path.join(__dirname, "../src/lib/psi-mock-data.ts"));

const item = buildPsiItems(PSI_MOCK_SOURCES)[0];
const t = item.totals;

/** @deprecated Renamed to totalDemand — kept only to catch stale scripts. */
const legacyForecastAlias = t.totalForecast;
if (legacyForecastAlias !== undefined) {
  console.error(
    "FAIL: totals.totalForecast is deprecated; use totals.totalDemand only."
  );
  process.exit(1);
}

if (!Array.isArray(t.totalDemand) || t.totalDemand.length !== PSI_MONTHS.length) {
  console.error(
    "FAIL: totals.totalDemand must be a",
    PSI_MONTHS.length,
    "month series."
  );
  process.exit(1);
}

let failed = 0;

function assert(label, condition, detail = "") {
  const ok = Boolean(condition);
  console.log(ok ? "OK" : "FAIL", label, detail);
  if (!ok) failed++;
}

function assertEq(label, got, want) {
  assert(label, got === want, `got ${got}, expected ${want}`);
}

// Excel spot checks (ending + rolled-up demand)
assertEq("Apr ending", t.endingInventory[0], 6950);
assertEq("May ending", t.endingInventory[1], 4445);
assertEq("Apr totalDemand", t.totalDemand[0], 3050);
assertEq("May totalDemand", t.totalDemand[1], 5505);

// Roll-forward chain
assert(
  "May beginning equals Apr ending",
  t.beginningInventory[1] === t.endingInventory[0]
);
for (let i = 0; i < PSI_MONTHS.length; i++) {
  const beginning =
    i === 0 ? item.initialInventory : t.endingInventory[i - 1];
  const receipt = item.scheduleReceipt[i] ?? 0;
  const demand = t.totalDemand[i];
  const ending = t.endingInventory[i];
  assertEq(
    `${PSI_MONTHS[i]} ending = beg + receipt - totalDemand`,
    ending,
    beginning + receipt - demand
  );
  if (i > 0) {
    assertEq(
      `${PSI_MONTHS[i]} beginning = prior ending`,
      t.beginningInventory[i],
      t.endingInventory[i - 1]
    );
  }
}

// MoS sanity (finite; matches Excel approx targets on sample)
assert(
  "Apr MoS finite",
  Number.isFinite(t.monthsOfSupply[0]),
  t.monthsOfSupply[0]?.toFixed(2)
);
assert(
  "May MoS finite",
  Number.isFinite(t.monthsOfSupply[1]),
  t.monthsOfSupply[1]?.toFixed(2)
);
console.log(
  "Apr MoS",
  t.monthsOfSupply[0].toFixed(2),
  `(Excel ref ~${PSI_905310_EXCEL_CHECKS.apr.monthsOfSupplyApprox})`
);
console.log(
  "May MoS",
  t.monthsOfSupply[1].toFixed(2),
  `(Excel ref ~${PSI_905310_EXCEL_CHECKS.may.monthsOfSupplyApprox})`
);

// Sample month dump (uses totalDemand — not totalForecast)
console.log("\n905310 Apr–Jul roll-forward:");
for (let i = 0; i < 4; i++) {
  console.log(PSI_MONTHS[i], {
    beg: t.beginningInventory[i],
    end: t.endingInventory[i],
    totalDemand: t.totalDemand[i],
    mos: t.monthsOfSupply[i].toFixed(2),
  });
}

process.exit(failed ? 1 : 0);
