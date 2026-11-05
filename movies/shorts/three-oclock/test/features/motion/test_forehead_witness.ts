import assert from "node:assert/strict";
import * as THREE from "three";

import { createForeheadWitness } from "../../../src/actors/createForeheadWitness";

/**
 * Keep the contact witness on its real source surface through head placement.
 *
 * @evidence contracts/testing.md#observable-behavior Supplies an independently defined sloping front surface and transformed head carrier to the real witness consumer. The sampled point lies on that surface and its world normal follows the carrier's rotation. Moving the returned descriptive point cannot mutate the retained witness; an absent front surface refuses.
 * @evidence contracts/testing.md#independent-cases The literal plane X=2-0.5Y-0.25Z supplies an analytic normal, independent of the helper's finite tangent construction. Translation, ninety-degree rotation and missing-source boundaries are covered. This pure projection test does not certify actual Human forehead contact or a completed shared reach.
 */
export function test_forehead_witness(): void {
  const object: THREE.Group = new THREE.Group(); object.position.set(3, 4, 5); object.rotation.y = Math.PI / 2;
  const head: { object: THREE.Group; min: [number, number, number]; max: [number, number, number]; frontAt: (y: number, z: number) => number | undefined } = {
    object, min: [0, 0, -1], max: [2, 2, 1], frontAt: (y: number, z: number): number => 2 - 0.5 * y - 0.25 * z,
  };
  const witness: ReturnType<typeof createForeheadWitness> = createForeheadWitness({ drawing: { head } });
  assert.ok(Math.abs(witness.localPoint.x - (2 - 0.5 * witness.localPoint.y - 0.25 * witness.localPoint.z)) < 1e-12);
  object.updateMatrixWorld(true);
  assert.ok(witness.point().distanceTo(object.localToWorld(witness.localPoint.clone())) < 1e-12);
  assert.ok(witness.normal().distanceTo(new THREE.Vector3(1, 0.5, 0.25).normalize().transformDirection(object.matrixWorld)) < 1e-10);
  const original: THREE.Vector3 = witness.point(); witness.localPoint.set(99, 99, 99); assert.deepEqual(witness.point(), original);
  assert.throws((): void => { createForeheadWitness({ drawing: { head: { ...head, frontAt: (): undefined => undefined } } }); });
}
