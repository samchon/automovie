import assert from "node:assert/strict";
import { join, resolve } from "node:path";
import test from "node:test";

const { runBenchmarkAudit } = require("../benchmark-audit.cjs") as {
  runBenchmarkAudit: (
    run: (command: string, args: string[], options: { shell: boolean; stdio: "inherit" }) => { status: number | null },
    write: (line: string) => void,
    probeDirectory?: string,
  ) => number;
};

void test("review audit runs every probe after local gates and sums failed exits", () => {
  const calls: Array<{ command: string; args: string[]; shell: boolean }> = [];
  const lines: string[] = [];
  const statuses = [0, 0, 0, 1, 0, 0, 0, 0, null, 0, 0];
  const failures = runBenchmarkAudit((command, args, options) => {
    calls.push({ command, args, shell: options.shell });
    return { status: statuses[calls.length - 1] ?? null };
  }, (line) => lines.push(line), "C:/review-probes");
  assert.equal(failures, 2);
  assert.equal(calls.length, 11);
  assert.deepEqual(calls.slice(3).map((call) => call.args[0]), [
    "src-literal-duplication.cjs", "src-review-host.mjs",
    "docs-review-host.mjs", "docs-review-host.mjs",
    "doc-review-numbers.mjs", "doc-anchor-graph.cjs",
    "face-binding-owner.cjs",
    "evidence-reason-shared.py",
  ].map((file) => join("C:/review-probes", file)));
  assert.ok(calls.slice(3).every((call) => call.args[1] === resolve(__dirname, "../../..") && !call.shell));
  assert.deepEqual(calls[4]?.args.slice(2), ["src/spaces"]);
  assert.deepEqual(calls[5]?.args.slice(2), ["docs/models"]);
  assert.deepEqual(calls[6]?.args.slice(2), ["docs/spaces"]);
  assert.equal(calls[10]?.command, "python");
  assert.match(lines.join(""), /benchmark audit: 11 gates, 2 failed/);
});

void test("review audit accepts a complete green run", () => {
  const lines: string[] = [];
  const result = runBenchmarkAudit(() => ({ status: 0 }), (line) => lines.push(line), "C:/review-probes");
  assert.equal(result, 0);
  assert.match(lines.join(""), /benchmark audit: 11 gates, 0 failed/);
});
