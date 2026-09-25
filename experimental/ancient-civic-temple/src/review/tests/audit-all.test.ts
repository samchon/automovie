import assert from "node:assert/strict";
import test from "node:test";

const { auditStatuses, runAudit } = require("../audit-all.cjs") as {
  auditStatuses: (statuses: number[]) => number;
  runAudit: (run: () => { status: number | null }, write: (line: string) => void) => number;
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
