/**
 * Run the four production checks in order through the current Node process.
 *
 * npm_execpath is required for the test, geometry and lint npm-script calls;
 * the paving-union entry runs directly through tsx. Each child runs from the
 * production root with a hidden Windows window and a 32 MiB output buffer.
 * Output and launch/status failures are reported after each synchronous
 * child; subsequent checks still run, and any failed check sets exitCode 1.
 * The failure total counts checks rather than diagnostics. Children have no
 * timeout, and their assertions do not establish a current visual verdict.
 */
import path from "node:path";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";

const root: string = path.resolve(import.meta.dirname, "../..");
const npmCli: string | undefined = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this aggregate through npm run check");

const tasks: Array<[string, string[]]> = [
  ["tests", [npmCli, "run", "test"]],
  ["geometry", [npmCli, "run", "geometry-audit"]],
  ["paving union", ["--import", "tsx", path.join(import.meta.dirname, "paving-union-check.ts")]],
  ["lint", [npmCli, "run", "lint"]],
];
let failures: number = 0;
for (const [name, args] of tasks) {
  const result: SpawnSyncReturns<string> = spawnSync(process.execPath, args, {
    windowsHide: true,
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1 << 25,
  });
  if (result.stdout) process.stdout.write(`[${name}]\n${result.stdout}`);
  if (result.stderr) process.stderr.write(`[${name}]\n${result.stderr}`);
  const failed: boolean = result.error !== undefined || result.status !== 0;
  if (failed) failures++;
  console.log(`[${name}] exit=${result.status ?? result.error?.message} failures=${failed ? 1 : 0}`);
}
console.log(`production check failures=${failures}`);
if (failures) process.exitCode = 1;
