import type * as THREE from "three";

/**
 * Whether an object belongs to display-only instrumentation, including any
 * ancestor marked `userData.humanObservationAuxiliary === true`. Auxiliary
 * objects are never subject parts, framing bounds or manually swapped surfaces.
 * Their materials separately opt out of global overrides with `allowOverride`.
 *
 * @evidence contracts/common.md#principled-implementation Walks the object and parent chain until an exact true auxiliary marker is found. Native scene parenting must be acyclic; absent, false or other truthy marker values do not opt an object out.
 * @evidence contracts/common.md#clear-and-simple-design An ancestor marker lets one display-only group exclude its descendants without naming every mesh or mixing them into subject bounds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit instrumentation provenance, not object names or fixture ids, determines exclusion. Material allowOverride is a separate native global-override duty and is not established by this predicate.
 * @evidence contracts/common.md#meaningful-documentation The comment states ancestor propagation and excluded subject/framing/material roles, keeping the marker distinct from material override support.
 * @evidence contracts/performance.md#efficient-algorithms Visits at most hierarchy depth H and stops at the first marker, linear time with constant storage.
 * @evidence contracts/performance.md#reuse-equivalent-work No result is cached because reparenting or marker changes can alter the answer. Callers reuse the same canonical predicate for their current object population.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows an object during traversal and returns a boolean, retaining no scene node, material or task.
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
