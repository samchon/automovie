import * as THREE from "three";
import type {AutoMovieRenderModeMesh} from "./AutoMovieRenderModeMesh.js";

const isMeshLike: (object: THREE.Object3D) => object is AutoMovieRenderModeMesh = (object: THREE.Object3D): object is AutoMovieRenderModeMesh =>
  (object as THREE.Mesh).isMesh === true;

/**
 * Collects actual mesh projections in deterministic traversal order without altering their state.
 *
 * @evidence contracts/common.md#principled-implementation Traverses the actual subtree and selects native isMesh markers, including skinned/instanced meshes, preserving Three child traversal order without interpreting visibility or authored identity as geometry admission.
 * @evidence contracts/common.md#clear-and-simple-design One collector supplies all guide-pass owners with the same supported mesh surface rather than repeated class-specific traversal logic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses native mesh role uniformly, with no fixture names or synthetic meshes; it reads markers and does not replace traversal or mutate scene state.
 * @evidence contracts/common.md#meaningful-documentation States actual mesh projection, deterministic order and no mutation; selection does not mean the source is visible or its custom deformation is supported by every pass.
 * @evidence contracts/performance.md#efficient-algorithms Visits O subtree objects once and appends M meshes, O(O) time and O(M) result references with no material/vertex copies.
 * @evidence contracts/performance.md#reuse-equivalent-work All passes reuse this collector implementation; mutable graph membership/order prevents a stale root-only collection cache, and pass owners handle their own cycle-equivalent material reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows root and transfers an array of borrowed mesh references; retains no scene registry, GPU allocation or task after return.
 */
export const collectAutoMovieRenderModeMeshes: (root: THREE.Object3D) => AutoMovieRenderModeMesh[] = (root: THREE.Object3D): AutoMovieRenderModeMesh[] => {
  const meshes: AutoMovieRenderModeMesh[] = [];
  root.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    if (isMeshLike(object)) meshes.push(object);
  });
  return meshes;
};
