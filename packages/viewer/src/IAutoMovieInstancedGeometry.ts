import type * as THREE from "three";

/**
 * A merged rigid prototype in world-rest metres. Geometry consists of owned
 * source clones. Lower-level flattening retains the supplied material objects:
 * the generated-model entry creates them with buildModel and hands them to
 * its result's consumer, while the adopted-object entry borrows host materials
 * whose lifetime remains with that host.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Carries the flattened representation used by a selected instanced tier.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Keeps merged rest geometry and its ordered material groups together.
 * @author Samchon
 */
export interface IAutoMovieInstancedGeometry {
  /**
   * Owned merged buffer with part-index and normalized colour/relief attributes.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Supplies the shared geometry drawn by instances of one prototype tier.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Retains a single rest-space representation rather than per-member geometry.
   */
  geometry: THREE.BufferGeometry;

  /**
   * Source material objects in rigid-part order, matching the merged groups;
   * flattening does not clone or dispose these borrowed material objects.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Keeps each flattened group associated with its source material.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Preserves the material order used by the prototype representation.
   */
  materials: THREE.Material[];
}
