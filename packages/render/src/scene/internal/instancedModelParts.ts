import type * as THREE from "three";

import { AutoMovieRenderThreeKind } from "../AutoMovieRenderThreeKind";

/*
 * Rigid parts of a built runtime model, in the one order instancing indexes.
 *
 * The merged instance geometry stamps each vertex with its part index and the
 * cycle bake writes one matrix row per part, so the two have to walk the model
 * the same way or every member wears another member's arm. They walk it here.
 */
export const instancedModelParts: (root: THREE.Object3D) => THREE.Mesh[] = (
  root: THREE.Object3D,
): THREE.Mesh[] => {
  const parts: THREE.Mesh[] = [];
  root.traverse((object: THREE.Object3D): void => {
    if (AutoMovieRenderThreeKind.isMesh(object)) parts.push(object);
  });
  return parts;
};
