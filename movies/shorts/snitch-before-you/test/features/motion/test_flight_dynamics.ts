import assert from "node:assert/strict";
import * as THREE from "three";
import { sampleBroomPath } from "../../../src/sampleBroomPath";
import { sampleSupportingPath } from "../../../src/sampleSupportingPath";
import { createBallFlights } from "../../../src/createBallFlights";
import { riderMassProxy } from "../../../src/riderMassProxy";

/**
 * Verify trajectory laws and free-object events independently of their display.
 *
 * @evidence contracts/testing.md#observable-behavior Numerically differentiates actual metric paths, compares the rigid forward/up axes with velocity and required force, and checks real gravity/impact trajectories and input ownership. This catches decorative bank, velocity seams and free balls still tied to mutated release inputs.
 * @evidence contracts/testing.md#independent-cases Uses every24Hz time plus both sides of phase boundaries, a known two-second equal-height ballistic arc, a moving normal impact and a coincident unit-mass point cloud. Controller budgets are declared scene assumptions, not human safety thresholds.
 */
export function test_flight_dynamics(): void {
  const eps: number = 0.0001;
  for (const kind of ["carina", "old"] as const) {
    for (let i: number = 1; i < 1440; i++) {
      const t: number = i / 24;
      const at: ReturnType<typeof sampleBroomPath> = sampleBroomPath(kind, t);
      const before: ReturnType<typeof sampleBroomPath> = sampleBroomPath(kind, t - eps);
      const after: ReturnType<typeof sampleBroomPath> = sampleBroomPath(kind, t + eps);
      const velocity: THREE.Vector3 = after.position.clone().sub(before.position).divideScalar(2 * eps);
      assert.ok(velocity.distanceTo(at.velocity) < 1e-5, `${kind} position/velocity disagree at${t}`);
      assert.ok(at.velocity.length() <= 12 && at.acceleration.length() <= 5);
      const forward: THREE.Vector3 = new THREE.Vector3(1, 0, 0).applyQuaternion(at.quaternion);
      assert.ok(forward.distanceTo(at.velocity.clone().normalize()) < 1e-9);
      const force: THREE.Vector3 = at.acceleration.clone().add(new THREE.Vector3(0, 9.81, 0));
      force.addScaledVector(forward, -force.dot(forward)).normalize();
      assert.ok(force.distanceTo(new THREE.Vector3(0, 1, 0).applyQuaternion(at.quaternion)) < 1e-9);
    }
    for (const t of [8, 10.5, 13.5, 17, 17.5, 23, 35, 36.2, 38.5, 41, 43, 44.3, 45.2, 46.5, 49.3, 49.5, 53]) {
      const a: ReturnType<typeof sampleBroomPath> = sampleBroomPath(kind, t - 1e-6);
      const b: ReturnType<typeof sampleBroomPath> = sampleBroomPath(kind, t + 1e-6);
      assert.ok(a.position.distanceTo(b.position) < 0.0001);
      assert.ok(a.velocity.distanceTo(b.velocity) < 0.0001, `${kind} velocity seam at${t}`);
      assert.ok(a.acceleration.distanceTo(b.acceleration) < 0.0001, `${kind} acceleration seam at${t}`);
    }
  }
  assert.ok(Math.abs(sampleBroomPath("old", 9).acceleration.z) > 0.5, "A rolled straight path is not a turn");
  assert.ok(Math.abs(sampleBroomPath("old", 9).position.z + 6) > 0.1);
  assert.equal(sampleBroomPath("carina", 53).velocity.x, 3);
  assert.equal(sampleBroomPath("old", 53).velocity.x, 1.5);
  assert.equal(sampleBroomPath("old", 53).position.y, 32.2);
  assert.equal(sampleBroomPath("old", 53).position.z, -6);
  for (let i: number = 0; i <= 1440; i++) {
    const p: ReturnType<typeof sampleSupportingPath> = sampleSupportingPath("G-K", i / 24);
    assert.ok(p.velocity.length() <= 12 && p.acceleration.length() <= 5, "Keeper exceeds the adopted platform design");
  }
  const origin: THREE.Vector3 = new THREE.Vector3(0, 5, 30);
  const balls: ReturnType<typeof createBallFlights> = createBallFlights([{ release: 0, catch: 2, origin, target: new THREE.Vector3(8, 5, 30), receiver: "receiver", receiverVelocity: new THREE.Vector3() }], [{ actor: "beater", time: 1, position: new THREE.Vector3(0, 35, 32), normal: new THREE.Vector3(1, 0, 0), batVelocity: new THREE.Vector3(2, 0, 0) }]);
  origin.set(999, 999, 999);
  assert.ok(balls.sample(1).quaffle!.distanceTo(new THREE.Vector3(4, 9.905, 30)) < 1e-10);
  assert.ok(balls.sample(2 - 1e-6).quaffle!.distanceTo(new THREE.Vector3(8, 5, 30)) < 0.00002);
  const strikeBefore: ReturnType<ReturnType<typeof createBallFlights>["sample"]> = balls.sample(1 - eps);
  const strikeAfter: ReturnType<ReturnType<typeof createBallFlights>["sample"]> = balls.sample(1 + eps);
  assert.ok(strikeBefore.bludgers[0]!.position.distanceTo(strikeAfter.bludgers[0]!.position) < 0.001);
  assert.ok(strikeBefore.bludgers[0]!.velocity.x < 0 && strikeAfter.bludgers[0]!.velocity.x > 0, "Normal impact did not redirect the free ball");
  const impact = balls.events.strikes[0] as { kind: string; outgoing: number[]; batAfter: number[]; batBefore: number[] };
  assert.equal(impact.kind, "bounce", "Material policy silently selected an inelastic deflection");
  assert.ok(Math.abs(2 * impact.batAfter[0]! + impact.outgoing[0]! - 1) < 1e-12, "Finite impact lost normal momentum");
  assert.ok(Math.abs((impact.outgoing[0]! - impact.batAfter[0]!) / 5 - 0.64) < 1e-12);
  assert.ok(Math.abs(balls.response("beater", 1).velocity.x - (impact.batAfter[0]! - impact.batBefore[0]!)) < 1e-12, "Bat response discarded velocityA");
  const caught = balls.events.catches[0] as { incoming: number[]; receiverAfter: number[]; ballAfter: number[] };
  assert.ok(new THREE.Vector3().fromArray(caught.receiverAfter).distanceTo(new THREE.Vector3().fromArray(caught.ballAfter)) < 1e-12, "Caught ball and receiver separate after absorption");
  assert.ok(new THREE.Vector3().fromArray(caught.receiverAfter).multiplyScalar(3.3).distanceTo(new THREE.Vector3().fromArray(caught.incoming).multiplyScalar(0.3)) < 1e-12);
  assert.equal(balls.response("receiver", 2 - eps).offset.length(), 0);
  assert.ok(balls.response("receiver", 2 + 0.1).offset.length() > 0.02, "Catch never drives a follow-through action");
  assert.ok(balls.response("receiver", 10).offset.length() < 1e-10);
  const response = balls.response("beater", 1.05);
  const responseDerivative: THREE.Vector3 = balls.response("beater", 1.05 + eps).offset.sub(balls.response("beater", 1.05 - eps).offset).divideScalar(2 * eps);
  assert.ok(response.velocity.distanceTo(responseDerivative) < 1e-5);
  const mass: ReturnType<typeof riderMassProxy> = riderMassProxy((): THREE.Vector3 => new THREE.Vector3(2, 3, 4));
  assert.ok(mass.centre.distanceTo(new THREE.Vector3(2, 3, 4)) < 1e-12);
  assert.ok(mass.secondMoment < 1e-24);
  assert.throws((): void => { sampleBroomPath("old", Number.NaN); });
}
