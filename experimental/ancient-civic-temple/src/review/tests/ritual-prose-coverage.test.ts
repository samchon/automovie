import assert from "node:assert/strict";
import test from "node:test";
import { checkModelProseConsistency, explicitEquationRows } from "../model-prose-consistency.mjs";

void test("the new ritual prototypes enter the dimensional review population", () => {
  const census = checkModelProseConsistency();
  const ritual = <T extends { id: string }>(rows: T[]): T[] => rows.filter(({ id }) => id.startsWith("ritual#"));
  assert.equal(ritual(census.equations).length, 3);
  assert.equal(ritual(census.ranges).length, 8);
  assert.equal(ritual(census.bounds).length, 11);
  assert.deepEqual(census.failures, []);
  assert.equal(explicitEquationRows("ritual#jar-stand", "0.05+0.25+0.04=0.35m")[0]?.pass, false);
});
