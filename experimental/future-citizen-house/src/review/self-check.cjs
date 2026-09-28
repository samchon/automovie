// Run every authored audit on every invocation; one failure cannot mask later
// failures. Keep each producer's own exit code and report the combined result.
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");

const checks = [
  ["--lint"],
  ["pure-tests.cjs", "--tsx"],
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
  ["build-model-catalog.py", "--python", "--check"],
  ["model-source-audit.cjs", "--tsx"],
  ["model-source-audit.cjs", "--tsx", "--fixture"],
];
let failures = 0;
let total = checks.length;
for (const args of checks) {
  const lint = args.includes("--lint");
  const tsx = args.includes("--tsx");
  const python = args.includes("--python");
  const command = lint
    ? process.platform === "win32"
      ? ["/d", "/s", "/c", "npm run lint"]
      : ["run", "lint"]
    : python
      ? args.filter((arg) => arg !== "--python")
    : tsx
      ? ["-r", "tsx/cjs", ...args.filter((arg) => arg !== "--tsx")]
      : args;
  const result = spawnSync(
    lint
      ? process.platform === "win32"
        ? "cmd.exe"
        : "npm"
      : python
        ? "python"
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
if (process.argv.includes("--bench")) {
  const probes = process.env.AUTOMOVIE_BENCH_PROBES || "D:/AutoMovieBench/probes";
  const benchChecks = [
    ["src-literal-duplication.cjs", root],
    ["src-review-host.mjs", root, "src/spaces"],
    ["docs-review-host.mjs", root, "docs/models"],
    ["doc-review-numbers.mjs", root],
    ["doc-anchor-graph.cjs", root],
    ["face-binding-owner.cjs", root],
    ["evidence-reason-shared.py", root],
  ];
  total += benchChecks.length;
  for (const [name, ...args] of benchChecks) {
    const result = spawnSync(
      name.endsWith(".py") ? "python" : process.execPath,
      [path.join(probes, name), ...args],
      { cwd: root, windowsHide: true, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    const empty = /NOTHING (?:WAS )?CHECKED/i.test(
      (result.stdout || "") + (result.stderr || ""),
    );
    const failed = result.error || result.status !== 0 || empty;
    console.log(
      `bench/${name}: ${failed ? `FAIL (${empty ? "empty population" : result.error?.message || result.status})` : "PASS"}`,
    );
    if (failed) failures++;
  }
}
console.log(`self-check: ${total} checks, ${failures} failures`);
if (failures) process.exitCode = 1;
