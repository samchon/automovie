import assert from "node:assert/strict";
import * as THREE from "three";

import { createHumanUniform } from "../../../src/actors/createHumanUniform";

/**
 * Restore authored cloth exactly after the new gathered crouch representation.
 *
 * @evidence contracts/testing.md#observable-behavior Supplies the garment owner's actual minimal bone/object dependency port, records all produced vertex buffers at ordinary pose, gathers them for the crouch and proves a zero amount restores identical original buffers. Invalid amounts refuse and dispose removes every owned object while preserving supplied bones. This tests deterministic garment state/resource ownership, not Human anatomy or movie appearance.
 * @evidence contracts/testing.md#independent-cases A scene with four named rigid carriers is enough for this consumer's declared port; literal untransformed world frames make original and restored bytes directly comparable. State zero must restore its prior geometry regardless of the preceding state, a nonzero state must affect cloth, and values outside0–1 cannot represent the documented bounded control. No expected garment vertex or model dimension is copied from its formula.
 */
export function test_garment_replay(): void {
  const object: THREE.Group = new THREE.Group();
  const bones: Map<string, THREE.Group> = new Map();
  for (const name of ["chest", "hips", "leftUpperLeg", "rightUpperLeg"]) { const bone: THREE.Group = new THREE.Group(); bone.name = name; object.add(bone); bones.set(name, bone); }
  const uniform: ReturnType<typeof createHumanUniform> = createHumanUniform({ object, bones }, "carina");
  /** Read the independent output buffers, without predicting their construction. */
  function positions(): number[][] {
    const rows: number[][] = [];
    object.traverse((item: THREE.Object3D): void => { if (item instanceof THREE.Mesh) rows.push(Array.from(item.geometry.getAttribute("position").array)); });
    return rows;
  }
  try {
    object.updateMatrixWorld(true); uniform.update(); const initial: number[][] = positions();
    uniform.update(1); assert.notDeepEqual(positions(), initial);
    uniform.update(0); assert.deepEqual(positions(), initial);
    assert.throws((): void => { uniform.update(1.1); });
    assert.throws((): void => { uniform.update(NaN); });
  } finally { uniform.dispose(); }
  assert.ok(object.children.every((item: THREE.Object3D): boolean => [...bones.values()].some((bone: THREE.Group): boolean => bone === item)));
  assert.ok([...bones.values()].every((bone: THREE.Group): boolean => bone.children.length === 0));
}
