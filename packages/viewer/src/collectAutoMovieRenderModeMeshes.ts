import * as THREE from "three";
import type {AutoMovieRenderModeMesh} from "./AutoMovieRenderModeMesh.js";

const isMeshLike = (object: THREE.Object3D): object is AutoMovieRenderModeMesh =>
  (object as THREE.Mesh).isMesh === true;

/**
 * Collects actual mesh projections in deterministic traversal order without altering their state.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Collects actual mesh projections in deterministic traversal order without altering their state.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Collects actual mesh projections in deterministic traversal order without altering their state.
 */
export const collectAutoMovieRenderModeMeshes = (root: THREE.Object3D): AutoMovieRenderModeMesh[] => {
  const meshes: AutoMovieRenderModeMesh[] = [];
  root.traverse((object) => {
    if (isMeshLike(object)) meshes.push(object);
  });
  return meshes;
};
