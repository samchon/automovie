import assert from "node:assert/strict";
import * as THREE from "three";

import { evaluateReachTarget } from "../../../src/actors/evaluateReachTarget";

/**
 * Keep the intended hand direction relative to its actual supported shoulder.
 *
 * @evidence contracts/testing.md#observable-behavior Uses the real reach-target adapter with a literal3–4–5 direction, measured0.6m radius and0.8fraction. Checks exact0.48m distance and direction, world translation invariance, unchanged inputs and refused malformed/coincident requests. This protects the body-relative action target rather than copying an unreachable fixed floor-height output.
 * @evidence contracts/testing.md#independent-cases Independent Euclidean geometry supplies the target offset[0,-0.384,0.288]. The case tests geometric goal authoring only; actual clinical reach, palm orientation, body support and final contact remain real consumer observations.
 */
export function test_reach_target(): void {
  const shoulder: THREE.Vector3 = new THREE.Vector3(1, 1.2, 2); const towards: THREE.Vector3 = shoulder.clone().add(new THREE.Vector3(0, -4, 3));
  const target: THREE.Vector3 = evaluateReachTarget(shoulder, towards, 0.6, 0.8);
  assert.ok(target.distanceTo(shoulder.clone().add(new THREE.Vector3(0, -0.384, 0.288))) < 1e-12);
  const shift: THREE.Vector3 = new THREE.Vector3(-2, 4, 0.5);
  assert.ok(evaluateReachTarget(shoulder.clone().add(shift), towards.clone().add(shift), 0.6, 0.8).distanceTo(target.clone().add(shift)) < 1e-12);
  assert.deepEqual(shoulder.toArray(), [1, 1.2, 2]);
  assert.throws((): void => { evaluateReachTarget(shoulder, shoulder, 0.6, 0.8); });
  assert.throws((): void => { evaluateReachTarget(shoulder, towards, 0.6, 1.1); });
}
