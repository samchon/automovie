import * as THREE from "three";
import type {AutoMovieRenderModeMesh} from "./AutoMovieRenderModeMesh.js";

const isMeshLike = (object: THREE.Object3D): object is AutoMovieRenderModeMesh =>
  (object as THREE.Mesh).isMesh === true;

/**
 * Collects actual mesh projections in deterministic traversal order without altering their state.
 */
export const collectAutoMovieRenderModeMeshes = (root: THREE.Object3D): AutoMovieRenderModeMesh[] => {
  const meshes: AutoMovieRenderModeMesh[] = [];
  root.traverse((object) => {
    if (isMeshLike(object)) meshes.push(object);
  });
  return meshes;
};
