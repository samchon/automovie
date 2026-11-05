import assert from "node:assert/strict";
import * as THREE from "three";

import { evaluateArrival } from "../../../src/actors/evaluateArrival";

/**
 * Protect the visible entrance, unaware facing and arm's-length stopping state.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the actual arrival planner at its source boundaries and all24fps root samples. Checks the west-wall crossing occurs inside the1.2m gap, Harry settles0.85m behind the still-north-facing Carina, and the13scontinuation starts without a position jump. It would catch a wrong opening, an early mutual facing or a misplaced arrival.
 * @evidence contracts/testing.md#independent-cases Literal courtyard boundaries and adopted0.85m spacing independently define expectations. Entry visibility, initial/final heading, fixed settled root and dense crossing samples cover the route; actual shoe support, pixel visibility and normal host timing are separate real-consumer observations.
 */
export function test_arrival_path(): void {
  const feet: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(0.03, 0, 0.09), right: new THREE.Vector3(0.03, 0, -0.09) };
  const before: ReturnType<typeof evaluateArrival> = evaluateArrival("carina", 13, feet);
  const after: ReturnType<typeof evaluateArrival> = evaluateArrival("carina", 13 + 1e-7, feet);
  assert.ok(before.position.distanceTo(after.position) < 1e-10);
  assert.ok(!evaluateArrival("harry", 13.3, feet).visible);
  assert.ok(evaluateArrival("harry", 13.4, feet).visible);
  const carina: ReturnType<typeof evaluateArrival> = evaluateArrival("carina", 25, feet);
  const harry: ReturnType<typeof evaluateArrival> = evaluateArrival("harry", 25, feet);
  assert.ok(Math.abs(carina.position.distanceTo(harry.position) - 0.85) < 1e-12);
  assert.equal(carina.heading, Math.PI / 2);
  assert.equal(harry.heading, Math.PI / 2);
  assert.ok(harry.position.distanceTo(evaluateArrival("harry", 19, feet).position) < 1e-12);
  let crossing: boolean = false;
  for (let frame: number = 321; frame <= 432; frame++) {
    const point: THREE.Vector3 = evaluateArrival("harry", frame / 24, feet).position;
    if (Math.abs(point.x + 4) < 0.15) { crossing = true; assert.ok(point.z >= 0 && point.z <= 1.2); }
  }
  assert.ok(crossing);
}
