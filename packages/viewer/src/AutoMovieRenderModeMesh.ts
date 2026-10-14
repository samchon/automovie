import * as THREE from "three";

/**
 * Names the mesh projection carrying one material or a material group during pass overrides.
 *
 * @evidence contracts/common.md#principled-implementation A Three mesh intersection exposes the single-or-array material slot that collectAutoMovieRenderModeMeshes observes before pass overrides; geometry and transforms keep the underlying mesh representation.
 * @evidence contracts/common.md#clear-and-simple-design Pass helpers share one material-bearing mesh projection instead of repeating casts for each supported render mode.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The projection describes ordinary mesh state and contains no special render-mode result or fixture identity.
 * @evidence contracts/common.md#meaningful-documentation States that this mesh projection carries either one material or a material group while an inspection pass overrides it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This intersection is erased and performs no mesh traversal or material allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The mesh projection coordinates no requests; override handles own restoration reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Material references retain their existing owner; declaring the projection acquires no GPU resource.
 */
export type AutoMovieRenderModeMesh = THREE.Mesh & {
  /** Original or temporary material slots, restored by the pass handle. */
  material: THREE.Material | THREE.Material[];
};
