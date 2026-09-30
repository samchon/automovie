import assert from "node:assert/strict";
import test from "node:test";
import { quoteOwnerFailures } from "./docs-spaces-quote-owner.cjs";

void test("quoted owner must match the H2 containing the quoted words", () => {
  const source = "spaces/rooms/common.md#common-kitchen-wall-reservation";
  const span = [
    [
      "R0001",
      "spaces/envelope/rear.md:78",
      "",
      `ELSEWHERE:${source}`,
      "quoted words",
    ],
  ];
  const base = {
    id: 1,
    file: "spaces/envelope/rear.md",
    host: "rear-garden-openings",
  };
  const valid = quoteOwnerFailures(
    [{ ...base, text: "common-kitchen-wall-reservation의 'quoted words'" }],
    span,
  );
  assert.equal(valid.checked, 1);
  assert.deepEqual(valid.failures, []);
  const mutated = quoteOwnerFailures(
    [{ ...base, text: "wrong-owner의 'quoted words'" }],
    span,
  );
  assert.equal(mutated.checked, 1);
  assert.equal(mutated.failures.length, 1);
});
