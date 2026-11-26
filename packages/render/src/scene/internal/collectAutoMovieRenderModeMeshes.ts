import * as THREE from "three";

import type { AutoMovieRenderModeMesh } from "./AutoMovieRenderModeMesh.js";
import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";

const isMeshLike: (
  object: THREE.Object3D,
) => object is AutoMovieRenderModeMesh = (
  object: THREE.Object3D,
): object is AutoMovieRenderModeMesh => AutoMovieThreeKind.isMesh(object);

/**
 * Collects actual mesh projections in deterministic traversal order without
 * altering their state.
 */
export const collectAutoMovieRenderModeMeshes: (
  root: THREE.Object3D,
) => AutoMovieRenderModeMesh[] = (
  root: THREE.Object3D,
): AutoMovieRenderModeMesh[] => {
  const meshes: AutoMovieRenderModeMesh[] = [];
  root.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    if (isMeshLike(object)) meshes.push(object);
  });
  return meshes;
};
