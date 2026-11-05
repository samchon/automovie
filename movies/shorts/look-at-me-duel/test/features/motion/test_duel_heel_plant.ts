import assert from "node:assert/strict";
import * as THREE from "three";

import { interpolateDuelHeelTargets } from "../../../src/interpolateDuelHeelTargets";

/**
 * @evidence contracts/testing.md#observable-behavior Heel planting rotates measured entry material lines around fixed fronts and reaches the exact flat endpoints without the rigid-length loss of point interpolation. Inputs remain unchanged and invalid phases or changed geometry refuse. Actual Human pose/floor admission remains an integration check.
 * @evidence contracts/testing.md#independent-cases A0.30m synthetic shoe line starts pitched35degrees and finishes horizontal under an oblique heading. Every24-step arc keeps its exact radius, starts/ends at independent vectors and preserves distinct world front anchors. A midpoint-chord implementation would fail the radius assertion. No sampled image or continuous motion result is inferred.
 */
export function test_duel_heel_plant(): void {
  const front: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(1, 0, -2), right: new THREE.Vector3(1.1, 0, -1.8) };
  const flat: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(-0.3, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.6), right: new THREE.Vector3(-0.3, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.6) };
  const entry: { left: THREE.Vector3; right: THREE.Vector3 } = { left: flat.left.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), -35 * Math.PI / 180), right: flat.right.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), -25 * Math.PI / 180) };
  const original: number[][] = [front.left.toArray(), front.right.toArray(), entry.left.toArray(), entry.right.toArray()];
  for (let frame: number = 0; frame <= 24; frame++) {
    const result: ReturnType<typeof interpolateDuelHeelTargets> = interpolateDuelHeelTargets(front, entry, flat, frame / 24);
    for (const side of ["left", "right"] as const) {
      assert.ok(Math.abs(result[side].distanceTo(front[side]) - 0.30) < 1e-10);
      if (frame === 0) assert.ok(result[side].distanceTo(front[side].clone().add(entry[side])) < 1e-10);
      if (frame === 24) assert.ok(result[side].distanceTo(front[side].clone().add(flat[side])) < 1e-10);
    }
  }
  assert.deepEqual([front.left.toArray(), front.right.toArray(), entry.left.toArray(), entry.right.toArray()], original);
  assert.throws((): void => { interpolateDuelHeelTargets(front, entry, flat, NaN); });
  assert.throws((): void => { interpolateDuelHeelTargets(front, entry, { left: flat.left.clone().multiplyScalar(0.5), right: flat.right }, 0.5); });
}
