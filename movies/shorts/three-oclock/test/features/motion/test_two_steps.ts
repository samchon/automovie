import assert from "node:assert/strict";

import { evaluateTwoSteps } from "../../../src/actors/evaluateTwoSteps";

/**
 * Protect planted feet, the alternating order and stable entry/exit of a walk.
 *
 * @evidence contracts/testing.md#observable-behavior A two-step approach needs one foot to stay planted during the other transfer and both feet to finish at the authored destination. Boundary and midpoint expectations use a 0.6 m move over 2 s; a dense round checks nonnegative swing clearance and monotone progression through the real pure planner without evaluating Human geometry.
 * @evidence contracts/testing.md#independent-cases The physical two-step requirement independently supplies before/after entry, alternating support, both half-cycle boundaries and destination cases. Zero travel and invalid durations/nonfinite inputs exercise caller boundaries. It cannot certify planted actual skin, support balance or visible gait; real Human fitting and moving review own those checks.
 */
export function test_two_steps(): void {
  assert.deepEqual(evaluateTwoSteps(-1, 2, 0.6), { root: 0, left: { forward: 0, lift: 0 }, right: { forward: 0, lift: 0 } });
  const middle: ReturnType<typeof evaluateTwoSteps> = evaluateTwoSteps(1, 2, 0.6);
  assert.equal(middle.root, 0.3);
  assert.equal(middle.left.forward, 0.6);
  assert.equal(middle.right.forward, 0);
  const final: ReturnType<typeof evaluateTwoSteps> = evaluateTwoSteps(3, 2, 0.6);
  assert.equal(final.root, 0.6);
  assert.equal(final.left.forward, 0.6);
  assert.equal(final.right.forward, 0.6);
  let previous: number = 0;
  for (let index: number = 0; index <= 100; index++) {
    const value: ReturnType<typeof evaluateTwoSteps> = evaluateTwoSteps(index / 50, 2, 0.6);
    assert.ok(value.root >= previous && value.root <= 0.6);
    assert.ok(value.left.lift >= 0 && value.right.lift >= 0);
    if (index < 50) assert.equal(value.right.forward, 0);
    else assert.equal(value.left.forward, 0.6);
    previous = value.root;
  }
  assert.equal(evaluateTwoSteps(1, 2, 0).root, 0);
  for (const args of [[0, 0, 1], [0, -1, 1], [0, 1, -1], [NaN, 1, 1]] as const)
    assert.throws((): void => { evaluateTwoSteps(args[0], args[1], args[2]); });
}
