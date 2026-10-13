import type * as THREE from "three";

/**
 * A merged rigid prototype in world-rest metres. Geometry consists of owned
 * source clones. Lower-level flattening retains the supplied material objects:
 * the generated-model entry creates them with buildModel and hands them to
 * its result's consumer, while the adopted-object entry borrows host materials
 * whose lifetime remains with that host.
 *
 * @author Samchon
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
