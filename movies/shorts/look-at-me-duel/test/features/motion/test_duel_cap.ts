import assert from "node:assert/strict";
import * as THREE from "three";
import { OBB } from "three/examples/jsm/math/OBB.js";

import { createDuelCapMotion } from "../../../src/createDuelCapMotion";
import { createDuelCourt } from "../../../src/createDuelCourt";
import { createDuelCapFloor } from "../../../src/createDuelCapFloor";

/**
 * @evidence contracts/testing.md#observable-behavior Actual cap/bearing/upright/base/strip supply retained contact and separated solids. Bearing exit inherits COM velocity and zero spin; free flight preserves it until tilted-corner impact. Floor and finite-base impulses determine rest rather than placing the block through its base. Reordered queries repeat the prepared response. Actor escape, calibrated materials and fracture forces are not certified.
 * @evidence contracts/testing.md#independent-cases Actual world bounds and public OBB check retained/sliding/falling/settling geometry against bearing, upright and base with1µm inset. Finite differences protect release continuity and torque-free flight. Dense4800/9600Hz responses with the same real obstacle must agree within2mm/2mrad and expose admitted residual/stabilization/energy diagnostics. A floor-only negative control intersects the actual base, preventing a vacuous regression. Invalid release/time refuses.
 */
export function test_duel_cap(): void {
  const court: ReturnType<typeof createDuelCourt> = createDuelCourt();
  const cap: THREE.Group = court.cap;
  const block: THREE.Mesh = cap.getObjectByName("cap stone") as THREE.Mesh;
  const bearingBounds: THREE.Box3 = new THREE.Box3().setFromObject(court.bearing);
  const stripBounds: THREE.Box3 = new THREE.Box3().setFromObject(court.upperJoint);
  try {
    const release: number = 40.875;
    assert.throws((): void => { createDuelCapMotion(cap, 35, court.bearing, court.base); });
    const motion: ReturnType<typeof createDuelCapMotion> = createDuelCapMotion(cap, release, court.bearing, court.base);
    assert.deepEqual(motion.at(0).position.toArray(), [1.7, 2.7, -2.3]);
    assert.equal(motion.at(0).rotationX, 0);
    assert.ok(motion.at(38).rotationX > 0 && motion.at(38).rotationX < 0.24);
    assert.ok(motion.at(release - 1e-6).centre.distanceTo(motion.at(release + 1e-6).centre) < 1e-4);
    assert.ok(motion.impactSeconds > release && motion.impactSeconds < release + 1);
    assert.equal(motion.physics.releaseAngularVelocity, 0);
    assert.equal(motion.physics.floor.admitted, true, JSON.stringify(motion.physics.floor));
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
      assertSeparated(block, court.base);
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
      assertSeparated(block, court.base);
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
      assert.equal(state.rotationX, 0.24, "No unmodelled torque accelerates the airborne block");
      assertSeparated(block, court.bearing);
      assertSeparated(block, court.upright);
      assertSeparated(block, court.base);
    }
    const firstImpact: ReturnType<typeof motion.at> = motion.at(motion.impactSeconds);
    cap.position.copy(firstImpact.position);
    cap.rotation.x = firstImpact.rotationX;
    cap.updateMatrixWorld(true);
    assert.ok(Math.abs(new THREE.Box3().setFromObject(cap).min.y) < 1e-8);
    assert.equal(firstImpact.rotationX, 0.24);
    assert.equal(firstImpact.landed, false);
    const velocity: THREE.Vector3 = firstImpact.centre.clone().sub(motion.at(motion.impactSeconds - 1e-6).centre).divideScalar(1e-6);
    const baseBounds: THREE.Box3 = new THREE.Box3().setFromObject(court.base);
    const base: NonNullable<Parameters<typeof createDuelCapFloor>[8]> = { minZ: baseBounds.min.z, maxZ: baseBounds.max.z, top: baseBounds.max.y };
    assert.deepEqual(motion.physics.floor.staticBase, base);
    const dense: ReturnType<typeof createDuelCapFloor> = createDuelCapFloor(firstImpact.centre, velocity, firstImpact.rotationX, 0, 0.25, 1, motion.impactSeconds, 9600, base);
    assert.equal(dense.diagnostics.admitted, true, JSON.stringify(dense.diagnostics));
    for (let step: number = 0; step <= 96; step++) {
      const time: number = motion.impactSeconds + step / 48;
      const state: ReturnType<typeof motion.at> = motion.at(time);
      const refined: ReturnType<typeof dense.at> = dense.at(time);
      assert.ok(state.centre.distanceTo(refined.centre) < 0.002, "Cap floor response must converge under doubled rate");
      assert.ok(Math.abs(state.rotationX - refined.rotationX) < 0.002);
      cap.position.copy(state.position);
      cap.rotation.x = state.rotationX;
      cap.updateMatrixWorld(true);
      assert.ok(new THREE.Box3().setFromObject(cap).min.y >= -1e-8);
      assertSeparated(block, court.bearing);
      assertSeparated(block, court.upright);
      assertSeparated(block, court.base);
    }
    const landed: ReturnType<typeof motion.at> = motion.at(motion.settledSeconds);
    cap.position.copy(landed.position);
    cap.rotation.x = landed.rotationX;
    cap.updateMatrixWorld(true);
    assert.ok(Math.abs(new THREE.Box3().setFromObject(cap).min.y) < 1e-8);
    assertSeparated(block, court.base);
    assert.ok(motion.physics.floor.minimumBaseSeparation! >= -1e-8);
    assert.equal(landed.landed, true);
    assert.deepEqual(motion.at(60), landed);
    motion.at(0);
    assert.deepEqual(motion.at(motion.settledSeconds), landed);
    assert.throws((): void => { motion.at(NaN); });
    // The floor-only calculation is a negative control: it really occupies
    // this existing base, so omitting the obstacle cannot pass unnoticed.
    const floorOnly: ReturnType<typeof createDuelCapFloor> = createDuelCapFloor(firstImpact.centre, velocity, firstImpact.rotationX, 0, 0.25, 1, motion.impactSeconds);
    const wrong: ReturnType<typeof floorOnly.at> = floorOnly.at(floorOnly.settledSeconds);
    cap.rotation.x = wrong.rotationX;
    cap.position.copy(wrong.centre).sub(new THREE.Vector3(0, 0.125, 0.5).applyAxisAngle(new THREE.Vector3(1, 0, 0), wrong.rotationX));
    cap.updateMatrixWorld(true);
    assert.throws((): void => { assertSeparated(block, court.base); });
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
