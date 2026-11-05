import assert from "node:assert/strict";
import * as THREE from "three";

import { resolveDuelUpperGoals } from "../../../src/resolveDuelUpperGoals";

/**
 * @evidence contracts/testing.md#observable-behavior Translation changes body-owned wrist/aim together, preserves world-held contacts and preserves a mixed head/body release without multiplying away root displacement. Tests protect Harry's independent body frame from Carina's raised-hand phase and require explicit valid head inputs. These are coordinate tests, not anatomical or visual acceptance.
 * @evidence contracts/testing.md#independent-cases Asymmetric metre vectors and a known three-axis displacement supply independent expected answers. Four release weights including0/1 verify additive partition; mutation checks protect borrowed inputs. Missing active head coordinates, nonfinite points and an out-of-range weight refuse. No Human solver result supplies the expected values.
 */
export function test_duel_upper_goals(): void {
  const plan: { position: THREE.Vector3; wrist: THREE.Vector3; aim: THREE.Vector3 } = { position: new THREE.Vector3(1, 0, -2), wrist: new THREE.Vector3(1.2, 1.3, -1.8), aim: new THREE.Vector3(2.1, 0.6, -1.2) };
  const delta: THREE.Vector3 = new THREE.Vector3(-0.15, 0.03, 0.12);
  const root: THREE.Vector3 = plan.position.clone().add(delta);
  const body: ReturnType<typeof resolveDuelUpperGoals> = resolveDuelUpperGoals(plan, root, { bodyWrist: 1, bodyAim: 1, raised: 0, outward: 0 });
  assert.ok(body.wrist.distanceTo(plan.wrist.clone().add(delta)) < 1e-12);
  assert.ok(body.aim.distanceTo(plan.aim.clone().add(delta)) < 1e-12);
  assert.ok(body.aim.clone().sub(body.wrist).distanceTo(plan.aim.clone().sub(plan.wrist)) < 1e-12);
  const held: ReturnType<typeof resolveDuelUpperGoals> = resolveDuelUpperGoals(plan, root, { bodyWrist: 0, bodyAim: 0, raised: 0, outward: 0 });
  assert.deepEqual(held.wrist, plan.wrist);
  assert.deepEqual(held.aim, plan.aim);
  const reference: THREE.Vector3 = new THREE.Vector3(1, 1.8, -2);
  for (const release of [0, 0.25, 0.5, 1]) {
    const mixed: ReturnType<typeof resolveDuelUpperGoals> = resolveDuelUpperGoals(plan, root, { bodyWrist: release, bodyAim: 0, raised: 1 - release, outward: 1, raisedReference: reference, actualRaised: reference.clone().add(delta) });
    assert.ok(mixed.wrist.distanceTo(plan.wrist.clone().add(delta)) < 1e-12);
    assert.ok(mixed.aim.distanceTo(plan.aim.clone().add(delta)) < 1e-12);
  }
  assert.deepEqual(plan.position.toArray(), [1, 0, -2]);
  assert.deepEqual(reference.toArray(), [1, 1.8, -2]);
  assert.throws((): void => { resolveDuelUpperGoals(plan, root, { bodyWrist: 1, bodyAim: 0, raised: 1, outward: 0 }); });
  assert.throws((): void => { resolveDuelUpperGoals(plan, root, { bodyWrist: 2, bodyAim: 0, raised: 0, outward: 0 }); });
  assert.throws((): void => { resolveDuelUpperGoals(plan, new THREE.Vector3(NaN, 0, 0), { bodyWrist: 1, bodyAim: 0, raised: 0, outward: 0 }); });
}
