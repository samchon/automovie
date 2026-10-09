// Run every authored audit on every invocation; one failure cannot mask later
// failures. Keep each producer's own exit code and report the combined result.
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(__dirname, "../..");

const checks = [
  ["--lint"],
  ["pure-tests.cts"],
  ["canopy-anchor-audit.cts"],
  ["ceiling-light-audit.cts"],
  ["space-literal-audit.cts"],
  ["space-literal-fixture.cts"],
  ["space-derive-audit.cts"],
  ["space-element-audit.cts"],
  ["space-element-audit.cts", "--fixture"],
  ["space-stringer-audit.cts"],
  ["space-stringer-audit.cts", "--fixture"],
  ["space-stringer-audit.cts", "--fixture-rod"],
  ["space-stringer-audit.cts", "--fixture-sphere"],
  ["space-stringer-audit.cts", "--fixture-population"],
  ["model-design-audit.cts"],
  ["model-design-audit.cts", "--fixture"],
  ["model-lineage-audit.cts"],
  ["model-lineage-audit.cts", "--fixture"],
  ["model-child-audit.cts"],
  ["model-address-audit.cts"],
  ["model-address-audit.cts", "--fixture"],
  ["model-coordinate-audit.cts"],
  ["model-coordinate-audit.cts", "--fixture"],
  ["model-coordinate-audit.cts", "--fixture-scalar"],
  ["model-owner-audit.cts"],
  ["model-part-audit.cts"],
  ["model-part-audit.cts", "--fixture"],
  ["model-review-audit.cts", "--duplicates"],
  ["model-review-audit.cts", "--faces"],
  ["model-review-audit.cts", "--fixture-duplicates"],
  ["model-review-audit.cts", "--fixture-faces"],
  ["build-model-catalog.cts", "--check"],
  ["model-source-audit.cts"],
  ["model-source-audit.cts", "--fixture"],
];
let failures = 0;
const total = checks.length;
for (const args of checks) {
  const lint = args.includes("--lint");
  const command = lint
    ? process.platform === "win32"
      ? ["/d", "/s", "/c", "npm run lint"]
      : ["run", "lint"]
    : ["-r", "tsx/cjs", ...args];
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
