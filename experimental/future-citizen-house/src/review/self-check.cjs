// Run every authored audit on every invocation; one failure cannot mask later
// failures. Keep each producer's own exit code and report the combined result.
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");

const checks = [
  ["--lint"],
  ["pure-tests.cjs", "--tsx"],
  ["canopy-anchor-audit.cjs", "--tsx"],
  ["ceiling-light-audit.cjs", "--tsx"],
  ["space-literal-audit.cjs"],
  ["space-literal-fixture.cjs"],
  ["space-derive-audit.cjs"],
  ["space-element-audit.cjs", "--tsx"],
  ["space-element-audit.cjs", "--tsx", "--fixture"],
  ["space-stringer-audit.cjs", "--tsx"],
  ["space-stringer-audit.cjs", "--tsx", "--fixture"],
  ["space-stringer-audit.cjs", "--tsx", "--fixture-rod"],
  ["space-stringer-audit.cjs", "--tsx", "--fixture-sphere"],
  ["space-stringer-audit.cjs", "--tsx", "--fixture-population"],
  ["model-design-audit.cjs"],
  ["model-design-audit.cjs", "--fixture"],
  ["model-lineage-audit.cjs"],
  ["model-lineage-audit.cjs", "--fixture"],
  ["model-child-audit.cjs"],
  ["model-address-audit.cjs"],
  ["model-address-audit.cjs", "--fixture"],
  ["model-coordinate-audit.cjs"],
  ["model-coordinate-audit.cjs", "--fixture"],
  ["model-coordinate-audit.cjs", "--fixture-scalar"],
  ["model-owner-audit.cjs"],
  ["model-part-audit.cjs"],
  ["model-part-audit.cjs", "--fixture"],
  ["model-review-audit.cjs", "--duplicates"],
  ["model-review-audit.cjs", "--faces"],
  ["model-review-audit.cjs", "--fixture-duplicates"],
  ["model-review-audit.cjs", "--fixture-faces"],
  ["build-model-catalog.cts", "--tsx", "--check"],
  ["model-source-audit.cjs", "--tsx"],
  ["model-source-audit.cjs", "--tsx", "--fixture"],
];
let failures = 0;
let total = checks.length;
for (const args of checks) {
  const lint = args.includes("--lint");
  const tsx = args.includes("--tsx");
  const command = lint
    ? process.platform === "win32"
      ? ["/d", "/s", "/c", "npm run lint"]
      : ["run", "lint"]
    : tsx
      ? ["-r", "tsx/cjs", ...args.filter((arg) => arg !== "--tsx")]
      : args;
  const result = spawnSync(
    lint
      ? process.platform === "win32"
        ? "cmd.exe"
        : "npm"
      : process.execPath,
    command,
    {
      cwd: lint ? root : __dirname,
      windowsHide: true,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const label = args.join(" ");
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  const failed = result.error || result.status !== 0;
  console.log(
    `${label}: ${failed ? `FAIL (${result.error?.message || result.status})` : "PASS"}`,
  );
  if (failed) failures++;
}
console.log(`self-check: ${total} checks, ${failures} failures`);
if (failures) process.exitCode = 1;
