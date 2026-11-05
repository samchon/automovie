import assert from "node:assert/strict";
import * as THREE from "three";

import { createPaperFall } from "../../../src/props/createPaperFall";

/**
 * Keep release gravity, real lower-corner contact and rest deterministic.
 *
 * @evidence contracts/testing.md#observable-behavior Samples the actual paper adapter from a rigid vertical release through three seconds. Independently checks Earth's first100ms gravity displacement, positive pre-contact clearance, no post-contact floor penetration, a measured contact in the expected subsecond range, stopped normal velocity, exact fixed rest and random-seek equality. Invalid scale, initial contact and nonfinite time refuse.
 * @evidence contracts/testing.md#independent-cases A2mm by150mm by100mm box starts1.2m high at a nonzeroXZ location; literal g·t²/2 gives the early expectation independently of the adapter's contact root. Exact physical vertices are transformed to compare floor height, and a second flat release covers a different original orientation. No Human fitting or watched motion is inferred.
 */
export function test_paper_fall(): void {
  const paper: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.15, 0.1), new THREE.MeshBasicMaterial());
  paper.position.set(-1.8, 1.2, -0.03);
  const fall: ReturnType<typeof createPaperFall> = createPaperFall(paper);
  assert.ok(fall.contactSeconds > 0.4 && fall.contactSeconds < 0.55);
  assert.ok(Math.abs(fall.at(0.1).position.y - (1.2 - 9.81 * 0.01 / 2)) < 1e-12);
  assert.ok(Math.abs(fall.impact.velocityA.y) < 1e-10);
  for (let index: number = 0; index <= 720; index++) {
    const seconds: number = index / 240;
    const value: ReturnType<typeof fall.at> = fall.at(seconds);
    const attribute: THREE.BufferAttribute = paper.geometry.getAttribute("position") as THREE.BufferAttribute;
    let minimum: number = Infinity;
    for (let vertex: number = 0; vertex < attribute.count; vertex++) minimum = Math.min(minimum, new THREE.Vector3().fromBufferAttribute(attribute, vertex).applyQuaternion(value.quaternion).add(value.position).y);
    assert.ok(minimum >= -1e-10);
    assert.ok(Math.abs(minimum - value.floorMinimum) < 1e-12);
  }
  assert.deepEqual(fall.at(1), fall.at(3));
  const random: ReturnType<typeof fall.at> = fall.at(0.35);
  fall.at(0.1); fall.at(2);
  assert.deepEqual(fall.at(0.35), random);
  const velocity: THREE.Vector3 = new THREE.Vector3(0.1, 0, -0.05);
  const moving: ReturnType<typeof createPaperFall> = createPaperFall(paper, velocity);
  velocity.set(99, 99, 99);
  assert.ok(Math.abs(moving.at(0.1).position.x - (paper.position.x + 0.01)) < 1e-12);
  assert.ok(Math.abs(moving.at(0.1).position.z - (paper.position.z - 0.005)) < 1e-12);
  assert.deepEqual(moving.at(1), moving.at(3));
  paper.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  assert.ok(createPaperFall(paper).contactSeconds > 0.4);
  paper.scale.y = 2;
  assert.throws((): void => { createPaperFall(paper); });
  paper.scale.y = 1; paper.position.y = 0;
  assert.throws((): void => { createPaperFall(paper); });
  assert.throws((): void => { fall.at(NaN); });
  paper.geometry.dispose(); (paper.material as THREE.Material).dispose();
}
