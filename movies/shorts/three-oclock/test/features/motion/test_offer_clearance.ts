import assert from "node:assert/strict";
import * as THREE from "three";

import { measureOfferClearance } from "../../../src/actors/measureOfferClearance";

/**
 * Refuse touching/sideways offers using displayed geometry rather than raw goals.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the real clearance consumer with finite paper and two hand meshes. A vertically separated upward offer admits; moving receiver fingers/hand into the giver bounds, rotating a tall paper into the receiver, turning the palm down, or placing the edge below the palm refuses. No author target distance substitutes for those actual objects.
 * @evidence contracts/testing.md#independent-cases Simple independent box dimensions produce known separated/intersecting bounds. Covers actual object transforms, the conservative-overlap refusal, vertical direction, horizontal miss and malformed normal. Does not claim those boxes are Human anatomy or that bounding-box overlap proves penetration; actual Human integration is a separate full-frame gate.
 */
export function test_offer_clearance(): void {
  const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
  const paper: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.15, 0.1), material);
  const giver: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.06), material);
  const receiver: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.1), material);
  paper.position.y = 1.255; giver.position.y = 1.18; receiver.position.y = 1.06;
  const edge: THREE.Vector3 = new THREE.Vector3(0, 1.18, 0);
  const palm: THREE.Vector3 = new THREE.Vector3(0, 1.06, 0);
  const up: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  assert.ok(measureOfferClearance(paper, [giver], [receiver], edge, palm, up).admitted);
  const separateFinger: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.05), material);
  separateFinger.position.y = 1.18;
  assert.ok(!measureOfferClearance(paper, [giver], [receiver, separateFinger], edge, palm, up).admitted);
  assert.ok(!measureOfferClearance(paper, [giver], [], edge, palm, up).admitted);
  receiver.position.y = 1.18;
  assert.ok(!measureOfferClearance(paper, [giver], [receiver], edge, palm, up).admitted);
  receiver.position.y = 1.06;
  assert.ok(!measureOfferClearance(paper, [giver], [receiver], edge, palm, up.clone().negate()).admitted);
  assert.ok(!measureOfferClearance(paper, [giver], [receiver], new THREE.Vector3(0, 1.0, 0), palm, up).admitted);
  assert.ok(!measureOfferClearance(paper, [giver], [receiver], edge.clone().setX(0.2), palm, up).admitted);
  paper.position.y = 1.10; paper.rotation.z = Math.PI / 4;
  assert.ok(!measureOfferClearance(paper, [giver], [receiver], edge, palm, up).admitted);
  assert.ok(!measureOfferClearance(paper, [giver], [receiver], edge, palm, new THREE.Vector3(0, 2, 0)).admitted);
  paper.geometry.dispose(); giver.geometry.dispose(); receiver.geometry.dispose(); separateFinger.geometry.dispose(); material.dispose();
}
