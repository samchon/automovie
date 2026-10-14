import type * as THREE from "three";

/**
 * Rigid parts of a built runtime model, in the one order instancing indexes.
 *
 * The merged instance geometry stamps each vertex with its part index and the cycle bake writes one matrix row per part, so the two have to walk the model the same way or every member wears another member's arm. They walk it here.
 *
 * @evidence contracts/common.md#principled-implementation Collects actual isMesh nodes in Three's existing traversal order so merged part indices and cycle matrix rows consume one common order.
 * @evidence contracts/common.md#clear-and-simple-design One traversal helper owns rigid-part enumeration rather than each instancing consumer deriving its own ordering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No node name or fixture ordering is substituted for actual traversal, and this collection does not admit anatomical partitions or alter meshes.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains the shared part-index/matrix-row contract and why ordering must agree across flattening and cycle baking.
 * @evidence contracts/performance.md#efficient-algorithms A single N-node traversal retains P matching mesh references, costing O(N) time and O(P) result space without geometry copying.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers share this enumeration rule but each call observes the current object tree; no old parts array is cached across graph changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned mesh references borrow the model owner's objects and keep them reachable while used; no geometry, texture or native renderer handle is acquired.
 */
export const instancedModelParts: (root: THREE.Object3D) => THREE.Mesh[] = (root: THREE.Object3D): THREE.Mesh[] => {
  const parts: THREE.Mesh[] = [];
  root.traverse((object: THREE.Object3D): void => {
    if ((object as THREE.Mesh).isMesh === true)
      parts.push(object as THREE.Mesh);
  });
  return parts;
};
