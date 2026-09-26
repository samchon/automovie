const assert = require("node:assert/strict");
const test = require("node:test");
const { taskPlan, execute } = require("./review-check.cjs");

void test("review plan includes all seven probe types, both review populations and the production check", () => {
  const plan = taskPlan("C:/probes", "C:/npm/cli.js");
  assert.equal(plan.length, 9);
  assert.deepEqual(
    plan.map(([name]) => name),
    [
      "src-literal-duplication",
      "src-review-host",
      "docs-review-host",
      "doc-review-numbers",
      "doc-anchor-graph",
      "face-binding-owner",
      "evidence-reason-docs",
      "evidence-reason-src",
      "production-check",
    ],
  );
  assert.deepEqual(plan[1][2].slice(-1), ["src/spaces"]);
  assert.deepEqual(plan[2][2].slice(-1), ["docs/models"]);
  assert.deepEqual(plan[6][2].slice(-1), ["docs"]);
  assert.deepEqual(plan[7][2].slice(-1), ["src"]);
  assert.deepEqual(plan[8][2].slice(-2), ["run", "check"]);
});

void test("every check runs and nonzero or failed spawn statuses accumulate", () => {
  /** @type {Array<[string, string, string[]]>} */
  const tasks = [
    ["a", "node", []],
    ["b", "node", []],
    ["c", "node", []],
  ];
  const statuses = [0, 2, null];
  let called = 0;
  const result = execute(tasks, () => ({
    status: statuses[called++],
    stdout: "ok",
  }));
  assert.equal(called, 3);
  assert.equal(result.exitSum, 3);
  assert.deepEqual(
    result.results.map((row) => row.status),
    [0, 2, 1],
  );
});

void test("a zero-population probe is counted as unverified even when it exits zero", () => {
  /** @type {Array<[string, string, string[]]>} */
  const tasks = [
    ["a", "node", []],
    ["b", "node", []],
    ["c", "node", []],
  ];
  const outputs = ["NOTHING CHECKED", "NOTHING WAS CHECKED", "1 row checked"];
  let called = 0;
  const result = execute(tasks, () => ({ status: 0, stdout: outputs[called++] }));
  assert.equal(result.exitSum, 2);
  assert.deepEqual(result.results.map((row) => row.status), [1, 1, 0]);
  assert.deepEqual(result.results.map((row) => row.unchecked), [true, true, false]);
});
