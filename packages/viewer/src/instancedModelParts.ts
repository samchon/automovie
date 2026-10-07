import type * as THREE from "three";

/**
 * Rigid parts of a built runtime model, in the one order instancing indexes.
 *
 * The merged instance geometry stamps each vertex with its part index and the
 * cycle bake writes one matrix row per part, so the two have to walk the model
 * the same way or every member wears another member's arm. They walk it here.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Applies the formation's resolved turn and speed response here.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Materializes that response in the group-motion cycle state.
 */
export const instancedModelParts = (root: THREE.Object3D): THREE.Mesh[] => {
  const parts: THREE.Mesh[] = [];
  root.traverse((object) => {
    if ((object as THREE.Mesh).isMesh === true)
      parts.push(object as THREE.Mesh);
  });
  return parts;
};
