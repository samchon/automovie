import assert from "node:assert/strict";
import * as THREE from "three";

import { selectFingerPad } from "../../../src/actors/selectFingerPad";
import { createNotePickupFrame } from "../../../src/props/createNotePickupFrame";

/**
 * Keep material addressing and an edge pickup grounded in actual finite geometry.
 *
 * @evidence contracts/testing.md#observable-behavior Queries a known original finger-like box at83percent of its segment and proves the hit lies on its actual palmar face rather than a terminal seam/extreme. Invalid anatomical/parallel inputs refuse. The actual2mm note is tipped through65phases; all eight original corners remain above the paving, the far lower edge stays fixed and the initial transform is preserved. No hand-contact, body-reach or successful pickup is inferred from those pure tests.
 * @evidence contracts/testing.md#independent-cases Literal30x10x10mm geometry gives an analytic24.9mm longitudinal and5mm surface address. A separate150x100x2mm note starts at3D translated rest with its known lower face onY0; direct transformed original corners/edge supply expectations for0–35degree rotation. Nonflat note and out-of-range phase cases refuse independently of the implementation's returned minimum.
 */
export function test_pickup_geometry(): void {
  const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
  const finger: THREE.BoxGeometry = new THREE.BoxGeometry(0.03, 0.01, 0.01); finger.translate(0.015, 0, 0);
  const mesh: THREE.Mesh = new THREE.Mesh(finger, material);
  const selected: ReturnType<typeof selectFingerPad> = selectFingerPad(mesh, new THREE.Vector3(0.03, 0, 0), new THREE.Vector3(0, 1, 0), 0.83, 0);
  assert.ok(Math.abs(selected.point.x - 0.0249) < 1e-8); assert.ok(Math.abs(selected.point.y - 0.005) < 1e-8);
  assert.ok(selected.normal.y > 0.999999 && selected.triangle >= 0);
  assert.throws((): void => { selectFingerPad(mesh, new THREE.Vector3(), new THREE.Vector3(0, 1, 0), 0.83, 0); });
  assert.throws((): void => { selectFingerPad(mesh, new THREE.Vector3(0.03, 0, 0), new THREE.Vector3(1, 0, 0), 0.83, 0); });
  const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(0.002, 0.15, 0.1);
  const paper: THREE.Mesh = new THREE.Mesh(geometry, material); paper.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  geometry.computeBoundingBox(); const box: THREE.Box3 = geometry.boundingBox!;
  paper.position.set(-1.64, -box.min.x, -0.063); paper.updateMatrixWorld(true);
  const pickup: ReturnType<typeof createNotePickupFrame> = createNotePickupFrame(paper);
  assert.ok(pickup.at(0).matrix.elements.every((value: number, index: number): boolean => Math.abs(value - paper.matrixWorld.elements[index]!) < 1e-12));
  const far: THREE.Vector3 = new THREE.Vector3(box.min.x, box.max.y, 0).applyMatrix4(paper.matrixWorld);
  for (let index: number = 0; index <= 64; index++) {
    const state: ReturnType<ReturnType<typeof createNotePickupFrame>["at"]> = pickup.at(index / 64);
    assert.ok(new THREE.Vector3(box.min.x, box.max.y, 0).applyMatrix4(state.matrix).distanceTo(far) < 1e-12);
    for (let corner: number = 0; corner < 8; corner++) assert.ok(new THREE.Vector3(corner & 1 ? box.max.x : box.min.x, corner & 2 ? box.max.y : box.min.y, corner & 4 ? box.max.z : box.min.z).applyMatrix4(state.matrix).y >= -1e-10);
  }
  assert.throws((): void => { pickup.at(1.1); });
  paper.quaternion.identity(); paper.updateMatrixWorld(true); assert.throws((): void => { createNotePickupFrame(paper); });
  finger.dispose(); geometry.dispose(); material.dispose();
}
