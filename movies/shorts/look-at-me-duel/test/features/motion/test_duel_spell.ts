import assert from "node:assert/strict";
import * as THREE from "three";

import { createDuelSpell } from "../../../src/createDuelSpell";
import { duelEvents } from "../../../src/duelEvents";
import { selectDuelPalmPoint } from "../../../src/selectDuelPalmPoint";

/**
 * @evidence contracts/testing.md#observable-behavior The real streak object's transform must reach the supplied launch and deflection points at the common event instants, vanish at mortar contact and restore after reverse seeking. A selected palm witness must be an actual mesh vertex, never its empty bounding-box centre. Actual scene pose fitting and visible effect scale are separate consumer checks.
 * @evidence contracts/testing.md#independent-cases Distinct nonzero3D endpoints expose double transforms and wrong legs. Independent distance and visibility assertions check contact/release boundaries; an arbitrary seek followed by a repeated contact must agree exactly. An asymmetric BoxGeometry supplies finite surface points and an empty geometry must refuse witness selection. Owned resources are always disposed.
 */
export function test_duel_spell(): void {
  const spell: ReturnType<typeof createDuelSpell> = createDuelSpell();
  const launch: THREE.Vector3 = new THREE.Vector3(-1, 1.3, 0.2);
  const deflect: THREE.Vector3 = new THREE.Vector3(1, 1.5, -0.7);
  const impact: THREE.Vector3 = new THREE.Vector3(1.7, 2.7, -2.27);
  const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(0.02, 0.1, 0.08);
  const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
  const empty: THREE.BufferGeometry = new THREE.BufferGeometry();
  try {
    spell.seek(0, launch, deflect, impact);
    assert.equal(spell.object.visible, false);
    spell.seek(duelEvents.shotLaunch, launch, deflect, impact);
    assert.equal(spell.object.visible, true);
    assert.ok(spell.object.position.distanceTo(launch) < 1e-12);
    spell.seek(duelEvents.shotDeflect, launch, deflect, impact);
    assert.ok(spell.object.position.distanceTo(deflect) < 1e-12);
    const before: THREE.Vector3 = spell.object.position.clone();
    spell.seek(duelEvents.mortarImpact, launch, deflect, impact);
    assert.equal(spell.object.visible, false);
    spell.seek(duelEvents.shotDeflect, launch, deflect, impact);
    assert.deepEqual(spell.object.position, before);
    const witness: [number, number, number] = selectDuelPalmPoint(new THREE.Mesh(geometry, material));
    const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = geometry.getAttribute("position");
    assert.ok(Array.from({ length: attribute.count }, (_value: unknown, index: number): boolean => witness[0] === attribute.getX(index) && witness[1] === attribute.getY(index) && witness[2] === attribute.getZ(index)).some((value: boolean): boolean => value));
    assert.ok(witness[0] > 0 && Math.abs(witness[0] - 0.01) < 1e-8);
    assert.throws((): void => { selectDuelPalmPoint(new THREE.Mesh(empty, material)); });
  } finally { spell.dispose(); geometry.dispose(); empty.dispose(); material.dispose(); }
}
