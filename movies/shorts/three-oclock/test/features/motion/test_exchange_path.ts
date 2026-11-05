import assert from "node:assert/strict";
import * as THREE from "three";

import { evaluateExchange } from "../../../src/actors/evaluateExchange";

/**
 * Protect discovery-turn continuity and the offered-then-withdrawn ownership beat.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the actual planner across25s and every turn/offer frame. Requires continuous root/feet on entry, Harry's fixed planted root/goals, Carina's completed opposite facing and settled world feet, and a palm offer before the paper target approaches then returns toward her chest. The real Human/paper consumer separately admits support, actual reach and visible non-contact.
 * @evidence contracts/testing.md#independent-cases Uses2mm continuity, stationary Harry and positive above-palm planned separation without copying generated FK. Dense turn samples require finite nonnegative foot heights and each foot's swing goal to clear the65mm shoes; settled feet are compared across27–36s. These are planner checks, not a fit/hover/hand-contact certificate.
 */
export function test_exchange_path(): void {
  const feet: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(0.03, 0, 0.09), right: new THREE.Vector3(0.03, 0, -0.09) };
  const before: ReturnType<typeof evaluateExchange> = evaluateExchange("carina", 25, feet);
  const after: ReturnType<typeof evaluateExchange> = evaluateExchange("carina", 25 + 1e-7, feet);
  assert.ok(before.position.distanceTo(after.position) < 0.002);
  for (const side of ["left", "right"] as const) assert.ok(before[side].distanceTo(after[side]) < 0.002);
  const harry: ReturnType<typeof evaluateExchange> = evaluateExchange("harry", 25, feet);
  const swing: { left: number; right: number } = { left: 0, right: 0 };
  const settled: ReturnType<typeof evaluateExchange> = evaluateExchange("carina", 27, feet);
  for (let frame: number = 600; frame <= 864; frame++) {
    const h: ReturnType<typeof evaluateExchange> = evaluateExchange("harry", frame / 24, feet);
    assert.ok(h.position.distanceTo(harry.position) < 1e-12);
    assert.ok(h.left.distanceTo(harry.left) < 1e-12 && h.right.distanceTo(harry.right) < 1e-12);
    const c: ReturnType<typeof evaluateExchange> = evaluateExchange("carina", frame / 24, feet);
    assert.ok([...c.left.toArray(), ...c.right.toArray()].every(Number.isFinite));
    for (const side of ["left", "right"] as const) { assert.ok(c[side].y >= 0.001 - 1e-12); swing[side] = Math.max(swing[side], c[side].y); if (frame >= 648) assert.ok(c[side].distanceTo(settled[side]) < 1e-12); }
  }
  assert.ok(swing.left > 0.08 && swing.right > 0.08);
  assert.equal(evaluateExchange("carina", 27, feet).heading, -Math.PI / 2);
  assert.ok(evaluateExchange("harry", 29.5, feet).rightTarget !== undefined);
  assert.equal(evaluateExchange("carina", 29.5, feet).rightTarget, undefined);
  const offered: THREE.Vector3 = evaluateExchange("carina", 32, feet).rightTarget!;
  const palm: THREE.Vector3 = evaluateExchange("harry", 32, feet).rightTarget!;
  assert.ok(offered.y - palm.y >= 0.10);
  assert.ok(evaluateExchange("carina", 35, feet).rightTarget!.distanceTo(palm) > 0.2);
}
