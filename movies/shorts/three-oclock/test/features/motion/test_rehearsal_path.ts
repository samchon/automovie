import assert from "node:assert/strict";
import * as THREE from "three";

import { evaluateRehearsal } from "../../../src/actors/evaluateRehearsal";

/**
 * Protect the actual scene planner's staggered support and planted turn seam.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the current opening planner across its entire13s path, including both planted turns, approach endpoints and final return. Detects the former parallel-feet half-cycle0.6mstance, a left-pivot slip or an endpoint reset. Expectations come from the authored0.3m stagger,0.6m approach and initial scene frame; no Human solver is mocked.
 * @evidence contracts/testing.md#independent-cases Two supplied neutral witnesses isolate root/foot geometry without body generation. Dense samples bound fore-aft separation to0.3m, turning samples retain the left world point, and0/13comparison checks complete entry/exit. It does not establish actual mesh support, anatomical admission, garment contact or rendered readability, which the full actual-host round must observe.
 */
export function test_rehearsal_path(): void {
  const feet: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(0.03, 0, 0.09), right: new THREE.Vector3(0.03, 0, -0.09) };
  const opening: ReturnType<typeof evaluateRehearsal> = evaluateRehearsal(0, feet);
  const ending: ReturnType<typeof evaluateRehearsal> = evaluateRehearsal(13, feet);
  assert.ok(opening.position.distanceTo(ending.position) < 1e-12);
  assert.ok(opening.left.distanceTo(ending.left) < 1e-12);
  assert.ok(opening.right.distanceTo(ending.right) < 1e-12);
  assert.ok(Math.abs(opening.heading - ending.heading) < 1e-12);
  const arrival: ReturnType<typeof evaluateRehearsal> = evaluateRehearsal(1.5, feet);
  assert.ok(Math.abs(arrival.position.z - (opening.position.z - 0.6)) < 1e-12);
  for (let index: number = 0; index <= 312; index++) {
    const value: ReturnType<typeof evaluateRehearsal> = evaluateRehearsal(index / 24, feet);
    const forward: THREE.Vector3 = new THREE.Vector3(Math.cos(value.heading), 0, -Math.sin(value.heading));
    const separation: number = Math.abs(value.left.clone().sub(value.right).dot(forward));
    assert.ok(separation <= 0.300000000001);
  }
  const planted: THREE.Vector3 = evaluateRehearsal(4.1, feet).left;
  for (let index: number = 0; index <= 20; index++)
    assert.ok(evaluateRehearsal(4.1 + index / 20 * 0.35, feet).left.distanceTo(planted) < 1e-12);
}
