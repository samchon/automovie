/** Run the production gates and the independent benchmark read probes in one command. */
const { spawnSync } = require("node:child_process");
const { join, resolve } = require("node:path");
const { runAudit } = require("./audit-all.cjs");

/** @type {readonly (readonly [string, readonly string[]])[]} */
const probes = [
  ["src-literal-duplication.cjs", []],
  ["src-review-host.mjs", ["src/spaces"]],
  ["docs-review-host.mjs", ["docs/models"]],
  ["doc-review-numbers.mjs", []],
  ["doc-anchor-graph.cjs", []],
  ["face-binding-owner.cjs", []],
  ["evidence-reason-shared.py", []],
];

/**
 * @param {(command: string, args: string[], options: { shell: boolean; stdio: "inherit" }) => { status: number | null }} [run]
 * @param {(line: string) => void} [write]
 * @param {string} [probeDirectory]
 */
const runBenchmarkAudit = (
  run = spawnSync,
  write = (line) => process.stdout.write(line),
  probeDirectory = process.env.AUTOMOVIE_BENCH_PROBES ?? "D:/AutoMovieBench/probes",
) => {
  const production = resolve(__dirname, "../..");
  let failures = runAudit(run, write);
  for (const [file, extra] of probes) {
    const python = file.endsWith(".py");
    const command = python ? "python" : process.execPath;
    const result = run(command, [join(probeDirectory, file), production, ...extra], {
      shell: false,
      stdio: "inherit",
    });
    const status = result.status ?? 1;
    failures += status === 0 ? 0 : 1;
    write(`probe ${file}: ${status === 0 ? "PASS" : `FAIL (${status})`}\n`);
  }
  write(`benchmark audit: ${probes.length + 3} gates, ${failures} failed\n`);
  return failures;
};

module.exports = { runBenchmarkAudit };
if (require.main === module) process.exitCode = runBenchmarkAudit();
