import * as THREE from "three";

import type { AutoMovieRenderModeMesh } from "./AutoMovieRenderModeMesh";
import { AutoMovieRenderThreeKind } from "../AutoMovieRenderThreeKind";

/*
 * Collects actual mesh projections in deterministic traversal order without
 * altering their state.
 */
export const collectRenderModeMeshes: (
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

const isMeshLike: (
  object: THREE.Object3D,
) => object is AutoMovieRenderModeMesh = (
  object: THREE.Object3D,
): object is AutoMovieRenderModeMesh => AutoMovieRenderThreeKind.isMesh(object);
