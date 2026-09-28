import assert from "node:assert/strict";
import test from "node:test";

const { auditStatuses, runAudit } = require("../audit-all.cjs") as {
  auditStatuses: (statuses: number[]) => number;
  runAudit: (
    run: (command: string, args: string[], options: { shell: boolean }) => { status: number | null },
    write: (line: string) => void,
  ) => number;
};

void test("audit sums failures and still runs every gate", () => {
  assert.equal(auditStatuses([0, 1, 0, 2]), 2);
  let calls = 0;
  const lines: string[] = [];
  const failures = runAudit(() => ({ status: [1, null, 0][calls++] ?? null }), (line) => lines.push(line));
  assert.equal(calls, 3);
  assert.equal(failures, 2);
  assert.match(lines.join(""), /audit: 3 gates, 2 failed/);
});

void test("audit invokes npm without a shell when the CLI path is available", () => {
  const prior = process.env.npm_execpath;
  const calls: Array<{ command: string; args: string[]; shell: boolean }> = [];
  try {
    process.env.npm_execpath = "C:/npm/bin/npm-cli.js";
    assert.equal(runAudit((command, args, options) => {
      calls.push({ command, args, shell: options.shell });
      return { status: 0 };
    }, () => {}), 0);
    assert.deepEqual(calls.map(({ command, args, shell }) => [command, args, shell]), [
      [process.execPath, ["C:/npm/bin/npm-cli.js", "run", "lint"], false],
      [process.execPath, ["C:/npm/bin/npm-cli.js", "run", "test"], false],
      [process.execPath, ["C:/npm/bin/npm-cli.js", "run", "self-check"], false],
    ]);
    delete process.env.npm_execpath;
    calls.length = 0;
    assert.equal(runAudit((command, args, options) => {
      calls.push({ command, args, shell: options.shell });
      return { status: 0 };
    }, () => {}), 0);
    assert.deepEqual(calls.map(({ command, args, shell }) => [command, args, shell]), [
      [process.platform === "win32" ? "npm.cmd" : "npm", ["run", "lint"], process.platform === "win32"],
      [process.platform === "win32" ? "npm.cmd" : "npm", ["run", "test"], process.platform === "win32"],
      [process.platform === "win32" ? "npm.cmd" : "npm", ["run", "self-check"], process.platform === "win32"],
    ]);
  } finally {
    if (prior === undefined) delete process.env.npm_execpath;
    else process.env.npm_execpath = prior;
  }
});
