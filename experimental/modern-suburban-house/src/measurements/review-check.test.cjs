const assert = require("node:assert/strict");
const test = require("node:test");
const { taskPlan, execute, identifierStatus } = require(
  "./review-check.cjs",
);

void test("the plan keeps ordinary source and owner checks with the production check", () => {
  const plan = taskPlan("C:/probes", "C:/npm/cli.js");
  assert.deepEqual(plan.map(([name]) => name), [
    "src-literal-duplication",
    "src-review-missing-idents",
    "doc-anchor-graph",
    "face-binding-owner",
    "production-check",
  ]);
  assert.equal(plan[1][1], "python");
  assert.match(plan[1][2][0], /src-review-missing-idents\.py$/);
  assert.equal(plan[1][2].at(-1), "--all-tags");
  assert.deepEqual(plan[plan.length - 1][2].slice(-2), ["run", "check"]);
});

void test("missing source identifiers fail while the observed verb exception passes", () => {
  assert.equal(identifierStatus("rows 1266 tokens-with-absent-part 0", 0), 0);
  const verb = "flat" + "Maps";
  const missing = "build" + "UpperFloor";
  assert.equal(
    identifierStatus(
      `rows 1266 tokens-with-absent-part 1\nsrc/spaces/site/zone.ts:170\t@evidence\t${verb}\tabsent=${verb}`,
      1,
    ),
    0,
  );
  assert.equal(
    identifierStatus(
      `rows 1266 tokens-with-absent-part 1\nsrc/spaces/stair.ts:68\t@evidence\t${missing}\tabsent=${missing}`,
      1,
    ),
    1,
  );
  assert.equal(
    identifierStatus(
      `rows 1266 tokens-with-absent-part 2\nsrc/spaces/site/zone.ts:170\t@evidence\t${verb}\tabsent=${verb}`,
      1,
    ),
    1,
  );
  assert.equal(identifierStatus("unexpected producer output", 1), 1);
  assert.equal(identifierStatus("rows 0 tokens-with-absent-part 0", 0), 1);
  assert.equal(identifierStatus("rows 1266 tokens-with-absent-part 0", 1), 1);
});

void test("the identifier task contributes its normalized status to the command", () => {
  /** @type {Array<[string, string, string[]]>} */
  const task = [["src-review-missing-idents", "python", []]];
  const verb = "flat" + "Maps";
  const good = execute(task, () => ({
    status: 1,
    stdout: `rows 1266 tokens-with-absent-part 1\nsrc/spaces/site/zone.ts:170\t@evidence\t${verb}\tabsent=${verb}`,
  }));
  assert.equal(good.exitSum, 0);
  const bad = execute(task, () => ({ status: 1, stdout: "unparseable scan" }));
  assert.equal(bad.exitSum, 1);
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
