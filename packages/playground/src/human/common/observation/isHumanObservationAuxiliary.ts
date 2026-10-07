import type * as THREE from "three";

/**
 * Whether an object belongs to display-only instrumentation, including any
 * ancestor marked `userData.humanObservationAuxiliary === true`. Auxiliary
 * objects are never subject parts, framing bounds or manually swapped surfaces.
 * Their materials separately opt out of global overrides with `allowOverride`.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Separates observation instruments from the reviewed figure.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Prevents display-only instrumentation from changing the observed subject population.
 */
export function isHumanObservationAuxiliary(object: THREE.Object3D): boolean {
  for (
    let node: THREE.Object3D | null = object;
    node !== null;
    node = node.parent
  )
    if (node.userData.humanObservationAuxiliary === true) return true;
  return false;
}
