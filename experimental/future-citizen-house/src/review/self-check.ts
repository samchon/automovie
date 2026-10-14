/**
 * Run the twelve explicit checks below in order, including their fixture variants;
 * new audit files are not discovered automatically. Each child has its own cwd and
 * synchronous output buffer capped at 64 MiB, with a hidden Windows process window.
 * Spawn errors, signals/null status and nonzero exits each add one failed check,
 * while later checks still run; the final process exit code is 1 if any failed.
 * This runner preserves child output and reports checks, not accumulated raw exit
 * codes or a source/visual completion verdict. It has no child timeout, so a hung
 * child blocks later checks; child code owns any files/resources it acquires.
 */
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import path from "node:path";

const root: string = path.resolve(__dirname, "../..");

const checks: string[][] = [
  ["--lint"],
  ["pure-tests.ts"],
  ["canopy-anchor-audit.ts"],
  ["ceiling-light-audit.ts"],
  ["space-element-audit.ts"],
  ["space-stringer-audit.ts"],
  ["space-stringer-audit.ts", "--fixture"],
  ["space-stringer-audit.ts", "--fixture-rod"],
  ["space-stringer-audit.ts", "--fixture-sphere"],
  ["space-stringer-audit.ts", "--fixture-population"],
  ["model-source-audit.ts"],
  ["model-source-audit.ts", "--fixture"],
];
let failures: number = 0;
const total: number = checks.length;
for (const args of checks) {
  const lint: boolean = args.includes("--lint");
  const command: string[] = lint
    ? process.platform === "win32"
      ? ["/d", "/s", "/c", "npm run lint"]
      : ["run", "lint"]
    : ["-r", "tsx/cjs", ...args];
  const result: SpawnSyncReturns<string> = spawnSync(
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
  const label: string = args.join(" ");
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  const failed: boolean = result.error !== undefined || result.status !== 0;
  console.log(
    `${label}: ${failed ? `FAIL (${result.error?.message || result.status})` : "PASS"}`,
  );
  if (failed) failures++;
}
console.log(`self-check: ${total} checks, ${failures} failures`);
if (failures) process.exitCode = 1;
