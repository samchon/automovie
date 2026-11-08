import assert from "node:assert/strict";
import * as THREE from "three";

import { measurePaperContact } from "../../../src/actors/measurePaperContact";

/**
 * Distinguish actual carried-sheet contact from a misleading scalar gap.
 *
 * @evidence contracts/testing.md#observable-behavior Exercises the actual finite-face contact helper with a2mm sheet and exterior witness points. A rigidly moved sheet/contact pair passes; the same gap with a displaced or rotated sheet, excessive clearance, penetration, same-side witnesses, beyond-edge points and a degenerate transform refuses. These cases detect acceptance based solely on distance or an unused IK target.
 * @evidence contracts/testing.md#independent-cases Box dimensions and literal face coordinates independently define exact touch and .9mm permitted exterior clearance.1.1mm exceeds the declared1mm per-face limit. Rigid-transform invariance, finite edge bounds, side signs and zero-scale cases are physical expectations. No Human skin is mocked or gait/visual acceptance inferred.
 */
export function test_paper_contact(): void {
  const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(0.002, 0.15, 0.1);
  const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
  const paper: THREE.Mesh = new THREE.Mesh(geometry, material);
  try {
    const a: THREE.Vector3 = new THREE.Vector3(-0.0019, -0.075, 0);
    const b: THREE.Vector3 = new THREE.Vector3(0.0019, -0.075, 0);
    assert.ok(measurePaperContact(paper, a, b).admitted);
    assert.ok(!measurePaperContact(paper, new THREE.Vector3(-0.0021, 0, 0), new THREE.Vector3(0.0021, 0, 0)).admitted);
    assert.ok(measurePaperContact(paper, new THREE.Vector3(-0.0021, 0, 0), new THREE.Vector3(0.0021, 0, 0), 0.003).admitted);
    assert.ok(!measurePaperContact(paper, new THREE.Vector3(-0.0041, 0, 0), new THREE.Vector3(0.0041, 0, 0), 0.003).admitted);
    assert.ok(!measurePaperContact(paper, a, b, -1).admitted);
    assert.ok(!measurePaperContact(paper, new THREE.Vector3(-0.0005, 0, 0), b).admitted);
    assert.ok(!measurePaperContact(paper, a, new THREE.Vector3(-0.0019, 0, 0)).admitted);
    assert.ok(!measurePaperContact(paper, new THREE.Vector3(-0.0019, 0.08, 0), b).admitted);
    paper.position.set(2, 0.5, -1);
    paper.rotation.set(0.4, 1.2, 0.2);
    paper.updateMatrixWorld(true);
    const movedA: THREE.Vector3 = paper.localToWorld(a.clone());
    const movedB: THREE.Vector3 = paper.localToWorld(b.clone());
    assert.ok(measurePaperContact(paper, movedA, movedB).admitted);
    assert.ok(!measurePaperContact(paper, a, b).admitted);
    paper.position.x += 0.2;
    assert.ok(!measurePaperContact(paper, movedA, movedB).admitted);
    paper.scale.x = 0;
    assert.ok(!measurePaperContact(paper, movedA, movedB).admitted);
  } finally { geometry.dispose(); material.dispose(); }
}
