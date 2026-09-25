// Run every authored audit on every invocation; one failure cannot mask later
// failures. Keep each producer's own exit code and report the combined result.
const { spawnSync } = require("node:child_process");

const checks = [
  ["model-design-audit.cjs"],
  ["model-child-audit.cjs"],
  ["model-address-audit.cjs"],
  ["model-prose-table-audit.cjs"],
  ["model-prose-table-audit.cjs", "--fixture"],
  ["model-owner-audit.cjs"],
  ["model-part-audit.cjs"],
  ["model-part-audit.cjs", "--fixture"],
];
let failures = 0;
for (const args of checks) {
  const result = spawnSync(process.execPath, args, {
    cwd: __dirname,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const label = args.join(" ");
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  const failed = result.error || result.status !== 0;
  console.log(`${label}: ${failed ? `FAIL (${result.error?.message || result.status})` : "PASS"}`);
  if (failed) failures++;
}
console.log(`self-check: ${checks.length} checks, ${failures} failures`);
if (failures) process.exitCode = 1;
