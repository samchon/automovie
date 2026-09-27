const assert = require("node:assert/strict");
const test = require("node:test");
const { classifyQuotes } = require("./docs-spaces-review-quotes.cjs");

void test("quotation gate accepts exact source spans and identifies loose or absent text", () => {
  const result = classifyQuotes([
    "R1\ta\tt\tHOST\tx",
    "R2\ta\tt\tTARGET\ty",
    "R3\ta\tt\tELSEWHERE:settings/x.md#parent\tz",
    "R4\ta\tt\tLOOSE:H-1\tq",
    "R5\ta\tt\tABSENT\tr",
  ].join("\n"));
  assert.equal(result.checked, 5);
  assert.deepEqual(result.failures.map((line) => line.split("\t")[0]), ["R4", "R5"]);
});
