/** Run every production-owned gate and add their exit statuses. */
import { spawnSync } from "node:child_process";

type Run = (
  command: string,
  args: string[],
  options: { shell: boolean; stdio: "inherit"; windowsHide: boolean },
) => { status: number | null };

/** The number of gates whose exit status was not zero. */
export const auditStatuses = (statuses: readonly number[]): number =>
  statuses.reduce((failures, status) => failures + (status === 0 ? 0 : 1), 0);

/**
 * Run lint, test and self-check through the package manager that started this
 * process, print each gate's verdict and the total, and return the failure
 * count. `run` and `write` are injectable so a unit test can observe the calls.
 */
export const runAudit = (
  run: Run = spawnSync,
  write: (line: string) => void = (line) => process.stdout.write(line),
): number => {
  const scripts = ["lint", "test", "self-check"];
  const statuses = scripts.map((script) => {
    const npmCli = process.env.npm_execpath;
    const cli = typeof npmCli === "string" && npmCli.endsWith(".js") ? npmCli : null;
    const result = run(
      cli ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm",
      cli ? [cli, "run", script] : ["run", script],
      {
        shell: !cli && process.platform === "win32",
        stdio: "inherit",
        windowsHide: true,
      },
    );
    const status = result.status ?? 1;
    write(`audit ${script}: ${status === 0 ? "PASS" : `FAIL (${status})`}\n`);
    return status;
  });
  const failures = auditStatuses(statuses);
  write(`audit: ${scripts.length} gates, ${failures} failed\n`);
  return failures;
};

if (require.main === module) process.exitCode = runAudit();
