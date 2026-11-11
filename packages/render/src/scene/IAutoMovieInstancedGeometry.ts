import type * as THREE from "three";

/**
 * A merged rigid prototype in world-rest metres. Geometry consists of owned
 * source clones. Lower-level flattening retains the supplied material objects:
 * the generated-model entry creates them with buildModel and hands them to
 * its result's consumer, while the adopted-object entry borrows host materials
 * whose lifetime remains with that host.
 *
 * @evidence contracts/development/design.md#principled-representation A merged rigid rest-space BufferGeometry retains group-to-material ordering and source material identity while cloning vertex storage, so instance consumers share one prototype without mutating adopted source geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Geometry ownership and material borrowing are expressed separately because generated-model and adopted-object entries acquire materials from different owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Rigid flattening refuses unsupported skinned/morphed parts in its producer rather than presenting a static substitute under this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States rest-space metre units, owned geometry, material ordering and the ownership difference between generated and adopted entry points.
 */
export interface IAutoMovieInstancedGeometry {
  /**
   * Owned merged buffer with part-index and normalized colour/relief attributes.
   */
  geometry: THREE.BufferGeometry;

  /**
   * Source material objects in rigid-part order, matching the merged groups;
   * flattening does not clone or dispose these borrowed material objects.
   */
  materials: THREE.Material[];
}
