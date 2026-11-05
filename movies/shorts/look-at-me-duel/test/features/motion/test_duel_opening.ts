import assert from "node:assert/strict";
import * as THREE from "three";

import { evaluateDuelOpening } from "../../../src/evaluateDuelOpening";

/**
 * @evidence contracts/testing.md#observable-behavior Execute actual opening-goal evaluation and test distinct stance/swing feet, landing continuity, finite-time refusal and history-independent seeks. A drifting support goal, exchanged actor position or discontinuous step boundary fails. Actual Human fitting and viewed gait are separate checks.
 * @evidence contracts/testing.md#independent-cases A planted foot must not translate while the other steps; lift must stay above the court and land at zero. Both sides of all six authored short-step boundaries must converge to the same world point. Explicit synthetic neutral witnesses avoid measuring expectations from the scene's renderer. Metre continuity tolerance1e-5 covers only a two-microsecond sample gap.
 */
export function test_duel_opening(): void {
  const feet: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(0.04, -0.01, 0.11), right: new THREE.Vector3(0.04, -0.01, -0.11) };
  const early: ReturnType<typeof evaluateDuelOpening> = evaluateDuelOpening(0.1, "Harry", feet);
  const late: ReturnType<typeof evaluateDuelOpening> = evaluateDuelOpening(0.5, "Harry", feet);
  assert.equal(early.right.distanceTo(late.right), 0);
  assert.ok(early.left.y > 0 && late.left.y > 0);
  assert.ok(early.left.distanceTo(late.left) > 0.01);
  assert.equal(early.footMode, "rolling");
  assert.equal(evaluateDuelOpening(4, "Harry", feet).footMode, "ball");
  for (const boundary of [0.6, 1.2, 1.8, 2.4, 3.0, 3.6]) {
    const before: ReturnType<typeof evaluateDuelOpening> = evaluateDuelOpening(boundary - 1e-6, "Harry", feet);
    const after: ReturnType<typeof evaluateDuelOpening> = evaluateDuelOpening(boundary + 1e-6, "Harry", feet);
    assert.ok(before.left.distanceTo(after.left) < 1e-5);
    assert.ok(before.right.distanceTo(after.right) < 1e-5);
  }
  const start: ReturnType<typeof evaluateDuelOpening> = evaluateDuelOpening(0, "Harry", feet);
  const finish: ReturnType<typeof evaluateDuelOpening> = evaluateDuelOpening(9, "Harry", feet);
  assert.ok(Math.abs(finish.yaw - start.yaw) > 0.1);
  const frozen: ReturnType<typeof evaluateDuelOpening> = evaluateDuelOpening(2, "Carina", feet);
  evaluateDuelOpening(8, "Carina", feet);
  assert.deepEqual(evaluateDuelOpening(2, "Carina", feet), frozen);
  const beforePlant: ReturnType<typeof evaluateDuelOpening> = evaluateDuelOpening(5.9, "Carina", feet);
  const duringPlant: ReturnType<typeof evaluateDuelOpening> = evaluateDuelOpening(6.3, "Carina", feet);
  const afterPlant: ReturnType<typeof evaluateDuelOpening> = evaluateDuelOpening(6.7, "Carina", feet);
  assert.ok(duringPlant.right.y > 0);
  assert.ok(beforePlant.right.distanceTo(afterPlant.right) > 0.05);
  assert.ok(Math.abs(afterPlant.right.y) < 1e-10);
  assert.throws((): void => { evaluateDuelOpening(NaN, "Harry", feet); });
  assert.throws((): void => { evaluateDuelOpening(Infinity, "Carina", feet); });
}
