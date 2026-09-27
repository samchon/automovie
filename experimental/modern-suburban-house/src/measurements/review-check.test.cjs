const assert = require("node:assert/strict");
const test = require("node:test");
const { taskPlan, execute, identifierStatus } = require("./review-check.cjs");

void test("review plan includes source, model, and spaces review probes with the production check", () => {
  const plan = taskPlan("C:/probes", "C:/npm/cli.js");
  assert.equal(plan.length, 14);
  assert.deepEqual(
    plan.map(([name]) => name),
    [
      "src-literal-duplication",
      "src-review-host",
      "src-review-missing-idents",
      "docs-review-host",
      "docs-spaces-review-host",
      "docs-spaces-review-rows",
      "docs-spaces-review-quotes",
      "doc-review-numbers",
      "docs-spaces-review-numbers",
      "doc-anchor-graph",
      "face-binding-owner",
      "evidence-reason-docs",
      "evidence-reason-src",
      "production-check",
    ],
  );
  assert.deepEqual(plan[1][2].slice(-1), ["src/spaces"]);
  assert.match(plan[2][2][0], /src-review-missing-idents\.py$/);
  assert.deepEqual(plan[3][2].slice(-1), ["docs/models"]);
  assert.deepEqual(plan[4][2].slice(-1), ["docs/spaces"]);
  assert.deepEqual(plan[5][2].slice(-5), ["spaces", "spaces/rooms", "spaces/envelope", "spaces/roof", "spaces/site"]);
  assert.deepEqual(plan[8][2].slice(-1), ["docs/spaces"]);
  assert.deepEqual(plan[11][2].slice(-1), ["docs"]);
  assert.deepEqual(plan[12][2].slice(-1), ["src"]);
  assert.deepEqual(plan[13][2].slice(-2), ["run", "check"]);
});

void test("missing source identifiers fail while the observed verb exception passes", () => {
  assert.equal(identifierStatus("rows 1266 tokens-with-absent-part 0", 0), 0);
  const verb = "flat" + "Maps";
  const missing = "build" + "UpperFloor";
  assert.equal(identifierStatus(`rows 1266 tokens-with-absent-part 1\nsrc/spaces/site/zone.ts:170\t@evidenceReview\t${verb}\tabsent=${verb}`, 1), 0);
  assert.equal(identifierStatus(`rows 1266 tokens-with-absent-part 1\nsrc/spaces/stair.ts:68\t@evidenceReview\t${missing}\tabsent=${missing}`, 1), 1);
  assert.equal(identifierStatus(`rows 1266 tokens-with-absent-part 2\nsrc/spaces/site/zone.ts:170\t@evidenceReview\t${verb}\tabsent=${verb}`, 1), 1);
  assert.equal(identifierStatus("unexpected producer output", 1), 1);
  assert.equal(identifierStatus("rows 0 tokens-with-absent-part 0", 0), 1);
  assert.equal(identifierStatus("rows 1266 tokens-with-absent-part 0", 1), 1);
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

void test("quoted source comparison contributes failure and checks a nonempty population", () => {
  /** @type {Array<[string, string, string[]]>} */
  const tasks = [
    ["docs-spaces-review-rows", "node", []],
    ["docs-spaces-review-quotes", "node", []],
  ];
  const outputs = [
    "total 1184 hosts 121",
    "rows with quotes 165 spans 184 { HOST: 102, ELSEWHERE: 38, TARGET: 43, LOOSE: 1 }",
  ];
  let called = 0;
  const bad = execute(tasks, () => ({ status: 0, stdout: outputs[called++] }));
  assert.deepEqual(bad.results.map((row) => row.status), [0, 1]);
  assert.equal(bad.exitSum, 1);
  const good = execute(tasks, () => ({ status: 0, stdout: outputs[called++ % 2].replace("LOOSE: 1", "TARGET: 1") }));
  assert.equal(good.exitSum, 0);
});

void test("missing extracted rows or quotes cannot pass with a zero process exit", () => {
  /** @type {Array<[string, string, string[]]>} */
  const tasks = [
    ["docs-spaces-review-rows", "node", []],
    ["docs-spaces-review-quotes", "node", []],
  ];
  const result = execute(tasks, () => ({ status: 0, stdout: "no comparison reported" }));
  assert.deepEqual(result.results.map((row) => row.unchecked), [true, true]);
  assert.equal(result.exitSum, 2);
});
