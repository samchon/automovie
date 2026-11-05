import assert from "node:assert/strict";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

import { selectSoleContacts } from "../../../src/actors/selectSoleContacts";

/**
 * Require actual flat shoe-face vertices rather than a skin/ankle proxy.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the actual support selector on a rendered-style rounded shoe under a translated/yawed Foot carrier. Every returned point must map back to its original vertex index and the real lowest face, span a nondegenerate triangle, and use an anterior first point. The separate width edge must use two genuine anterior source vertices even when the winning support triangle has only one. A triangle without a flat supporting face refuses.
 * @evidence contracts/testing.md#independent-cases Uses a300x65x110mm rounded casing with9mm corners,6cm local centre and independent world placement. Exact original Float32 vertices, known local lowerY0.0275, anteriorX0.141 and0.092m flat width supply expectations independently of the returned triangle. An inclined single triangle cannot be substituted with invented flattened points.
 */
export function test_sole_contacts(): void {
  const foot: THREE.Group = new THREE.Group(); foot.position.set(2, 0.2, -1); foot.rotation.y = 0.7;
  const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
  const mesh: THREE.Mesh = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.065, 0.11, 1, 0.009), material); mesh.position.y = 0.06; foot.add(mesh);
  const result: ReturnType<typeof selectSoleContacts> = selectSoleContacts(mesh, foot);
  const attribute: THREE.BufferAttribute = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let index: number = 0; index < 3; index++) {
    const original: THREE.Vector3 = foot.worldToLocal(mesh.localToWorld(new THREE.Vector3().fromBufferAttribute(attribute, result.vertices[index]!)));
    assert.ok(original.distanceTo(result.points[index]!) < 1e-12);
    assert.ok(Math.abs(result.points[index]!.y - 0.0275) < 1e-7);
  }
  assert.ok(result.points[0].x >= result.points[1].x && result.points[0].x >= result.points[2].x);
  assert.ok(new THREE.Vector3().crossVectors(result.points[1].clone().sub(result.points[0]), result.points[2].clone().sub(result.points[0])).length() > 0.01);
  assert.ok(result.forefoot !== undefined);
  for (let index: number = 0; index < 2; index++) {
    const original: THREE.Vector3 = foot.worldToLocal(mesh.localToWorld(new THREE.Vector3().fromBufferAttribute(attribute, result.forefoot.vertices[index]!)));
    assert.ok(original.distanceTo(result.forefoot.points[index]!) < 1e-12);
    assert.ok(Math.abs(result.forefoot.points[index]!.x - 0.141) < 1e-7);
    assert.ok(Math.abs(result.forefoot.points[index]!.y - 0.0275) < 1e-7);
  }
  assert.ok(Math.abs(result.forefoot.points[0].distanceTo(result.forefoot.points[1]) - 0.092) < 1e-7);
  const invalid: THREE.BufferGeometry = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 0, 0, 1, 1], 3));
  assert.throws((): void => { selectSoleContacts(new THREE.Mesh(invalid, material), foot); });
  mesh.geometry.dispose(); invalid.dispose(); material.dispose();
}
