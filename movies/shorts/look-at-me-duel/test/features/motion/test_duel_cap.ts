import assert from "node:assert/strict";
import * as THREE from "three";
import { OBB } from "three/examples/jsm/math/OBB.js";

import { createDuelCapMotion } from "../../../src/createDuelCapMotion";
import { createDuelCourt } from "../../../src/createDuelCourt";

/**
 * @evidence contracts/testing.md#observable-behavior The actual court assembly supplies cap, finite bearing, upright and upper retaining strip. Every retained24fps sample must keep the rear-region underside on the ledge's south top edge, its upper rear contact inside the retaining strip and its solid outside both supporting stones. Ballistic release is continuous, stays above the floor and ends broad-face down. Arbitrary seek order reproduces the same stopped transform. No angular fracture simulation or actor escape is claimed.
 * @evidence contracts/testing.md#independent-cases World bearing/strip bounds supply contact witnesses independently of the controller's returned transform. Three's public oriented-box narrow phase detects positive solid overlap; a1µm inset excludes surface touching. Every retained/falling sample checks both bearing and upright rather than only an isolated cap. Floor contact hasY=0 within1e-8m and orientationπ, impact follows release by less than1second, exact stopped states match, and malformed release/time refuse.
 */
export function test_duel_cap(): void {
  const court: ReturnType<typeof createDuelCourt> = createDuelCourt();
  const cap: THREE.Group = court.cap;
  const block: THREE.Mesh = cap.getObjectByName("cap stone") as THREE.Mesh;
  const bearingBounds: THREE.Box3 = new THREE.Box3().setFromObject(court.bearing);
  const stripBounds: THREE.Box3 = new THREE.Box3().setFromObject(court.upperJoint);
  try {
    const release: number = 40.875;
    assert.throws((): void => { createDuelCapMotion(cap, 35, court.bearing); });
    const motion: ReturnType<typeof createDuelCapMotion> = createDuelCapMotion(cap, release, court.bearing);
    assert.deepEqual(motion.at(0).position.toArray(), [1.7, 2.7, -2.3]);
    assert.equal(motion.at(0).rotationX, 0);
    assert.ok(motion.at(38).rotationX > 0 && motion.at(38).rotationX < 0.24);
    assert.ok(motion.at(release - 1e-6).centre.distanceTo(motion.at(release + 1e-6).centre) < 1e-4);
    assert.ok(motion.impactSeconds > release && motion.impactSeconds < release + 1);
    const contactLocal: THREE.Vector3 = new THREE.Vector3(0, 0, bearingBounds.max.z + 2.3);
    for (let frame: number = 0; frame <= Math.floor(motion.webBreakSeconds * 24); frame++) {
      const state: ReturnType<typeof motion.at> = motion.at(frame / 24);
      cap.position.copy(state.position);
      cap.rotation.x = state.rotationX;
      cap.updateMatrixWorld(true);
      const contact: THREE.Vector3 = cap.localToWorld(contactLocal.clone());
      assert.ok(Math.abs(contact.y - bearingBounds.max.y) < 1e-8 && Math.abs(contact.z - bearingBounds.max.z) < 1e-8);
      const retained: THREE.Vector3 = cap.localToWorld(new THREE.Vector3(0, 0.25, 0));
      assert.ok(stripBounds.clone().expandByScalar(1e-8).containsPoint(retained), `Upper retaining contact at${frame / 24}`);
      assertSeparated(block, court.bearing);
      assertSeparated(block, court.upright);
    }
    const fixedContact: THREE.Vector3 = new THREE.Vector3(1.7, bearingBounds.max.y, bearingBounds.max.z);
    for (let frame: number = 0; frame <= 60; frame++) {
      const seconds: number = motion.webBreakSeconds + (release - motion.webBreakSeconds) * frame / 60;
      const state: ReturnType<typeof motion.at> = motion.at(seconds);
      cap.position.copy(state.position);
      cap.rotation.x = state.rotationX;
      cap.updateMatrixWorld(true);
      const slidingContact: THREE.Vector3 = cap.worldToLocal(fixedContact.clone());
      assert.ok(Math.abs(slidingContact.y) < 1e-8 && slidingContact.z >= -1e-8 && slidingContact.z <= contactLocal.z + 1e-8);
      assertSeparated(block, court.bearing);
      assertSeparated(block, court.upright);
    }
    for (const boundary of [motion.webBreakSeconds, release]) {
      const gap: number = 1e-5;
      const centre: THREE.Vector3 = motion.at(boundary).centre;
      const incoming: THREE.Vector3 = centre.clone().sub(motion.at(boundary - gap).centre).divideScalar(gap);
      const outgoing: THREE.Vector3 = motion.at(boundary + gap).centre.sub(centre).divideScalar(gap);
      assert.ok(incoming.distanceTo(outgoing) < 0.001, `Centre velocity continuity at${boundary}`);
    }
    for (let time: number = release; time <= motion.impactSeconds; time += 1 / 24) {
      const state: ReturnType<typeof motion.at> = motion.at(time);
      cap.position.copy(state.position);
      cap.rotation.x = state.rotationX;
      cap.updateMatrixWorld(true);
      assert.ok(new THREE.Box3().setFromObject(cap).min.y >= -1e-8);
      assertSeparated(block, court.bearing);
      assertSeparated(block, court.upright);
    }
    const landed: ReturnType<typeof motion.at> = motion.at(motion.impactSeconds);
    cap.position.copy(landed.position);
    cap.rotation.x = landed.rotationX;
    cap.updateMatrixWorld(true);
    assert.ok(Math.abs(new THREE.Box3().setFromObject(cap).min.y) < 1e-8);
    assert.equal(landed.rotationX, Math.PI);
    assert.equal(landed.landed, true);
    assert.deepEqual(motion.at(60), landed);
    motion.at(0);
    assert.deepEqual(motion.at(motion.impactSeconds), landed);
    assert.throws((): void => { motion.at(NaN); });
  } finally { court.dispose(); }
}

/** Exact emitted boxes use Three's public OBB narrow phase;1µm inset excludes mere surface contact. */
function assertSeparated(first: THREE.Mesh, second: THREE.Mesh): void {
  const a: OBB = new OBB().fromBox3(first.geometry.boundingBox!).applyMatrix4(first.matrixWorld);
  const b: OBB = new OBB().fromBox3(second.geometry.boundingBox ?? new THREE.Box3().setFromBufferAttribute(second.geometry.getAttribute("position") as THREE.BufferAttribute)).applyMatrix4(second.matrixWorld);
  a.halfSize.addScalar(-1e-6);
  b.halfSize.addScalar(-1e-6);
  assert.equal(a.intersectsOBB(b), false, `${first.name} intersects${second.name}`);
}
