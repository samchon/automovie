import assert from "node:assert/strict";
import * as THREE from "three";

import { evaluateDuelExchange } from "../../../src/evaluateDuelExchange";
import { evaluateDuelOpening } from "../../../src/evaluateDuelOpening";

/**
 * @evidence contracts/testing.md#observable-behavior The actual exchange-goal module must inherit both roles' opening footprints and wrists, raise the caught hand before the turn, release the grip and finish one complete body turn with independently timed retreat feet. Arbitrary seek order must not change goals. These tests establish authored logic only; actual Human surface/support and camera checks remain separate.
 * @evidence contracts/testing.md#independent-cases Synthetic asymmetric sole witnesses protect coordinate ownership. A full turn is2π. Grip releases before turn completion and the raised wrist exceeds1.70m. Every phase has continuous metre targets within1e-4 over two microseconds. Two backward beats each plant leading/closing feet; synthetic stance stays below0.9m. Active transfers do not impose the retired8degree heel rise. Final feet settle. These are goal bounds, not Human admission.
 */
export function test_duel_exchange(): void {
  const feet: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(0.04, -0.01, 0.11), right: new THREE.Vector3(0.04, -0.01, -0.11) };
  for (const role of ["Carina", "Harry"] as const) {
    const opening: ReturnType<typeof evaluateDuelOpening> = evaluateDuelOpening(9, role, feet);
    const start: ReturnType<typeof evaluateDuelExchange> = evaluateDuelExchange(9, role, feet);
    assert.ok(start.position.distanceTo(opening.position) < 1e-12);
    assert.ok(start.wrist.distanceTo(opening.wrist) < 1e-12);
    assert.ok(start.left.distanceTo(opening.left) < 1e-12 && start.right.distanceTo(opening.right) < 1e-12);
    for (const boundary of [9, 11.3, 11.6, 11.7, 12.1, 12.6, 12.7, 13, 14.7, 15.15, 15.725, 16.3, 17.1, 17.4, 17.8, 18.1, 18.8, 19.5, 20.2, 20.9]) {
      const before: ReturnType<typeof evaluateDuelExchange> = evaluateDuelExchange(boundary - 1e-6, role, feet);
      const after: ReturnType<typeof evaluateDuelExchange> = evaluateDuelExchange(boundary + 1e-6, role, feet);
      for (const key of ["position", "left", "right", "wrist"] as const) assert.ok(before[key].distanceTo(after[key]) < 1e-4, `${role} ${key} boundary ${boundary}`);
    }
    const held: ReturnType<typeof evaluateDuelExchange> = evaluateDuelExchange(13, role, feet);
    assert.equal(held.grip, 1);
    assert.equal(evaluateDuelExchange(16, role, feet).grip, 0);
    assert.ok(Math.abs(evaluateDuelExchange(25, role, feet).left.y) < 1e-10);
    assert.ok(Math.abs(evaluateDuelExchange(25, role, feet).right.y) < 1e-10);
    const frozen: ReturnType<typeof evaluateDuelExchange> = evaluateDuelExchange(14.4, role, feet);
    evaluateDuelExchange(10, role, feet);
    assert.deepEqual(evaluateDuelExchange(14.4, role, feet), frozen);
    for (let frame: number = 216; frame <= 600; frame++) {
      const plan: ReturnType<typeof evaluateDuelExchange> = evaluateDuelExchange(frame / 24, role, feet);
      if (plan.footMode === "settling") assert.ok(Math.abs(plan.left.y) < 1e-10 && Math.abs(plan.right.y) < 1e-10, "Heel planting begins only after both front transfers land");
    }
  }
  assert.ok(evaluateDuelExchange(13, "Carina", feet).wrist.y > 1.7);
  assert.equal(evaluateDuelExchange(13, "Carina", feet).raised, 1);
  assert.ok(evaluateDuelExchange(12.7, "Carina", feet).position.distanceTo(evaluateDuelExchange(9, "Carina", feet).position) > 0.5);
  assert.ok(evaluateDuelExchange(13, "Carina", feet).aim.y > evaluateDuelExchange(13, "Carina", feet).wrist.y);
  assert.equal(evaluateDuelExchange(25, "Harry", feet).pose.legs?.left.knee?.flexion, 5);
  assert.ok((evaluateDuelExchange(10.875, "Harry", feet).pose.legs?.left.knee?.flexion ?? 0) > 5, "Engaged approach owns a prepared support posture rather than a static ready-height input");
  assert.ok(Math.abs(evaluateDuelExchange(18, "Carina", feet).yaw - 0.65 - Math.PI * 2) < 1e-12);
  assert.ok(evaluateDuelExchange(18, "Carina", feet).wrist.y < 1.3);
  const parry: ReturnType<typeof evaluateDuelExchange> = evaluateDuelExchange(23.5, "Harry", feet);
  const forward: THREE.Vector3 = new THREE.Vector3(Math.cos(parry.yaw), 0, -Math.sin(parry.yaw));
  assert.ok(parry.aim.clone().sub(parry.wrist).dot(forward) > 0, "Parry stays in the forward hemisphere, not a wrist aimed backwards at the joint");
  assert.ok(parry.aim.y > parry.wrist.y && parry.wrist.y > evaluateDuelExchange(25, "Harry", feet).wrist.y + 0.1);
  assert.equal(parry.bodyAim, 1);
  assert.equal(evaluateDuelExchange(13, "Harry", feet).bodyAim, 1);
  assert.equal(evaluateDuelExchange(9.75, "Harry", feet).bodyWrist, 1);
  assert.equal(evaluateDuelExchange(14.75, "Carina", feet).footMode, "transfer");
  assert.equal(evaluateDuelExchange(12.95, "Harry", feet).footMode, "transfer");
  assert.equal(evaluateDuelExchange(13, "Harry", feet).footMode, "transfer");
  assert.equal(evaluateDuelExchange(17.375, "Harry", feet).footMode, "transfer");
  for (const role of ["Carina", "Harry"] as const) {
    const begin: number = role === "Carina" ? 11.6 : 9;
    assert.equal(evaluateDuelExchange(begin, role, feet).heelTilt, 0);
    assert.equal(evaluateDuelExchange(begin + 0.25, role, feet).heelTilt, 0);
    const plant: number = role === "Carina" ? 17.1 : 20.2;
    const before: ReturnType<typeof evaluateDuelExchange> = evaluateDuelExchange(plant - 1e-6, role, feet);
    const after: ReturnType<typeof evaluateDuelExchange> = evaluateDuelExchange(plant + 1e-6, role, feet);
    assert.deepEqual(before.pose.legs!.left.foot, after.pose.legs!.left.foot, "Toe controls cannot reset at heel-plant entry");
  }
  assert.equal(evaluateDuelExchange(20.2, "Harry", feet).footMode, "settling");
  assert.equal(evaluateDuelExchange(20.9, "Harry", feet).footMode, "ball");
  assert.equal(evaluateDuelExchange(17.2, "Carina", feet).footMode, "settling");
  assert.ok(evaluateDuelExchange(15.4, "Harry", feet).right.y > 0, "Release recovery owns the first pivot transfer");
  assert.ok(evaluateDuelExchange(16, "Harry", feet).left.y > 0, "Closing transfer follows the recovered heading");
  assert.ok((evaluateDuelExchange(15.792, "Carina", feet).pose.legs?.left.knee?.flexion ?? 0) > (evaluateDuelExchange(25, "Carina", feet).pose.legs?.left.knee?.flexion ?? 0), "The turn owns a prepared body posture and returns to ready stance");
  for (let frame: number = 418; frame <= 485; frame++) {
    const retreat: ReturnType<typeof evaluateDuelExchange> = evaluateDuelExchange(frame / 24, "Harry", feet);
    assert.ok(retreat.left.distanceTo(retreat.right) < 0.9, "Two backward beats must not hide a single metre-wide early landing");
  }
  for (const landing of [18.1, 18.8, 19.5, 20.2]) {
    const retreat: ReturnType<typeof evaluateDuelExchange> = evaluateDuelExchange(landing, "Harry", feet);
    assert.ok(Math.abs(retreat.left.y) < 1e-10 && Math.abs(retreat.right.y) < 1e-10);
  }
  assert.throws((): void => { evaluateDuelExchange(NaN, "Carina", feet); });
}
