import assert from "node:assert/strict";
import * as THREE from "three";

import { sampleWholeFlight } from "../../../src/sampleWholeFlight";
import { sampleFlight } from "../../../src/sampleFlight";
import { motionPhase } from "../../../src/motionPhase";
import { sampleReleasedBroom } from "../../../src/sampleReleasedBroom";

/**
 * Check temporal joins, hand ownership and replay through the composed timeline.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the actual whole sampler around its two composition boundaries and samples hand support before and after release. Checks absolute replay after mutating a prior returned frame, rather than trusting an implementation-only support label as proof of FK contact. Displayed contacts remain independently measured in Viewer.
 * @evidence contracts/testing.md#independent-cases Boundary positions must remain within two millimetres over two milliseconds at finite flight speed. Release may occur only after the new left support is present. Ending must keep both actors together while the old broom separates. Nonfinite time and reversed transition intervals are refused; returned frames must not share mutable positions.
 */
export function test_whole_flight(): void {
  const reach: THREE.Vector3 = new THREE.Vector3(0.7, 0.4, 0.2);
  for (const time of [23, 53]) {
    const a = sampleWholeFlight(time - 0.0001, reach);
    const b = sampleWholeFlight(time + 0.0001, reach);
    assert.ok(a.carina.pelvis.distanceTo(b.carina.pelvis) < 0.002);
    assert.ok(a.harry.pelvis.distanceTo(b.harry.pelvis) < 0.002);
    assert.ok(a.carinaBroom.position.distanceTo(b.carinaBroom.position) < 0.002);
    assert.ok(a.camera.distanceTo(b.camera) < 0.002, "A continuing composition jumps at its join");
  }
  assert.equal(sampleFlight(43.5).support.left, "new");
  assert.equal(sampleFlight(43.5).support.right, "old");
  assert.equal(sampleFlight(45.5).support.left, "new");
  assert.equal(sampleFlight(45.5).support.right, "new");
  const before = sampleWholeFlight(55, reach);
  const distance: number = before.carina.pelvis.distanceTo(before.harry.pelvis);
  const after = sampleWholeFlight(59, reach);
  assert.ok(Math.abs(after.carina.pelvis.distanceTo(after.harry.pelvis) - distance) < 1e-9);
  before.carina.pelvis.set(999, 999, 999);
  assert.ok(sampleWholeFlight(55, reach).carina.pelvis.distanceTo(after.carina.pelvis) < 20);
  assert.throws((): void => { sampleWholeFlight(Number.NaN, reach); });
  assert.throws((): void => { motionPhase(1, 3, 2); });
  const oldAt53 = sampleReleasedBroom(53).position;
  const oldAt59 = sampleReleasedBroom(59).position;
  assert.ok(oldAt59.x - oldAt53.x < after.carinaBroom.position.x - sampleWholeFlight(53, reach).carinaBroom.position.x, "Released broom overtakes the slower tandem");
  assert.ok(oldAt59.y > after.carinaBroom.position.y + 0.5 && oldAt59.z < after.carinaBroom.position.z - 1, "Loose shaft remains in the occupied support corridor");
  assert.ok(sampleWholeFlight(7.999, reach).camera.clone().sub(sampleWholeFlight(7.999, reach).target).normalize().dot(sampleWholeFlight(8.001, reach).camera.clone().sub(sampleWholeFlight(8.001, reach).target).normalize()) > 0.999, "Continuing race reverses its screen axis");
  assert.throws((): void => { sampleReleasedBroom(Number.POSITIVE_INFINITY); });
}
