/** Run every production-owned gate and add their exit statuses. */
const { spawnSync } = require("node:child_process");

/** @param {readonly number[]} statuses */
const auditStatuses = (statuses) => statuses.reduce(
  (failures, status) => failures + (status === 0 ? 0 : 1),
  0,
);

/**
 * @param {(command: string, args: string[], options: { shell: boolean; stdio: "inherit" }) => { status: number | null }} [run]
 * @param {(line: string) => void} [write]
 */
const runAudit = (run = spawnSync, write = (line) => process.stdout.write(line)) => {
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
      },
    );
    const status = result.status ?? 1;
    write(
      `audit ${script}: ${status === 0 ? "PASS" : `FAIL (${status})`}\n`,
    );
    return status;
  });
  const failures = auditStatuses(statuses);
  write(`audit: ${scripts.length} gates, ${failures} failed\n`);
  return failures;
};

module.exports = { auditStatuses, runAudit };
if (require.main === module) process.exitCode = runAudit();
