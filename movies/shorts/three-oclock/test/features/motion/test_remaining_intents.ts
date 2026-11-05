import assert from "node:assert/strict";
import * as THREE from "three";

import { evaluateDeparture } from "../../../src/actors/evaluateDeparture";
import { evaluateExchange } from "../../../src/actors/evaluateExchange";
import { evaluateSharedReach } from "../../../src/actors/evaluateSharedReach";

/**
 * Preserve source order and inherited staging in the later action planners.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the actual independent action planners. The36s seam preserves the previous root/feet; the measured contact parameter stops the first bend before recovery; Harry's backward retreat is exactly0.5m and settled before pickup. His receive permission precedes the giver's release permission. Departure reaches outside the actual west gap rather than the solid west return.
 * @evidence contracts/testing.md#independent-cases Uses two different measured contact events and literal story boundaries, not a fitted pose as its oracle. Checks both actors, repeated seeking, invalid contact input and before/after event ordering. These are intent tests only: none claims physical attachment, forehead contact, ground pickup or a rendered36–60s segment.
 */
export function test_remaining_intents(): void {
  const reference: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(0.1, 0, 0.1), right: new THREE.Vector3(0.1, 0, -0.1) };
  const note: THREE.Vector3 = new THREE.Vector3(-1.75, 0.001, 0.05);
  const event: { time: number; progress: number } = { time: 40.5, progress: 0.7 };
  for (const person of ["carina", "harry"] as const) {
    const old: ReturnType<typeof evaluateExchange> = evaluateExchange(person, 36, reference);
    const start: ReturnType<typeof evaluateSharedReach> = evaluateSharedReach(person, 36, reference, event, note);
    assert.deepEqual(start.position, old.position); assert.deepEqual(start.left, old.left); assert.deepEqual(start.right, old.right);
    const stopped: ReturnType<typeof evaluateSharedReach> = evaluateSharedReach(person, event.time + 0.1, reference, event, note);
    assert.equal(stopped.bendAmount, event.progress);
    assert.equal(evaluateSharedReach(person, 43.3, reference, event, note).bendAmount, 0);
    const changed: { time: number; progress: number } = { time: 41.2, progress: 0.85 };
    assert.equal(evaluateSharedReach(person, changed.time + 0.1, reference, changed, note).bendAmount, changed.progress);
    const before: ReturnType<typeof evaluateSharedReach> = evaluateSharedReach(person, 48, reference, event, note);
    assert.deepEqual(evaluateDeparture(person, 48, reference, event, note), before);
    assert.deepEqual(evaluateDeparture(person, 53, reference, event, note), evaluateDeparture(person, 53, reference, event, note));
  }
  const h36: ReturnType<typeof evaluateExchange> = evaluateExchange("harry", 36, reference);
  const h48: ReturnType<typeof evaluateSharedReach> = evaluateSharedReach("harry", 48, reference, event, note);
  assert.ok(Math.abs(h48.position.distanceTo(h36.position) - 0.5) < 1e-12);
  for (const person of ["carina", "harry"] as const) {
    const planted: ReturnType<typeof evaluateSharedReach> = evaluateSharedReach(person, 39, reference, event, note);
    assert.equal(planted.rightHandRole, "free");
    assert.equal(planted.rightTarget, undefined);
    assert.ok(planted.rightReach!.towards.y === note.y && planted.rightReach!.fraction < 1);
    assert.deepEqual(planted.rightNormal!.toArray(), [0, -1, 0]);
    assert.equal(planted.rightNormalWeight, 1);
    const first: ReturnType<typeof evaluateSharedReach> = evaluateSharedReach(person, event.time + 0.1, reference, event, note);
    const second: ReturnType<typeof evaluateSharedReach> = evaluateSharedReach(person, 44.5, reference, event, note);
    assert.ok(second.bendAmount > first.bendAmount * 0.2 && second.bendAmount < first.bendAmount * 0.4);
  }
  assert.deepEqual(evaluateSharedReach("harry", 47.8, reference, event, note).position, h48.position);
  assert.ok(evaluateDeparture("harry", 51.9, reference, event, note).requests.includes("receive"));
  assert.ok(!evaluateDeparture("carina", 51.9, reference, event, note).requests.includes("give"));
  assert.ok(evaluateDeparture("carina", 52.2, reference, event, note).requests.includes("give"));
  const exit: ReturnType<typeof evaluateDeparture> = evaluateDeparture("carina", 59.7, reference, event, note);
  assert.ok(exit.position.distanceTo(new THREE.Vector3(-4.6, exit.position.y, 0.6)) < 1e-9);
  const crossing: ReturnType<typeof evaluateDeparture> = evaluateDeparture("carina", 59, reference, event, note);
  assert.ok(crossing.position.z > 0 && crossing.position.z < 1.2);
  assert.throws((): void => { evaluateSharedReach("carina", 40, reference, { time: 39, progress: 0.7 }, note); });
}
