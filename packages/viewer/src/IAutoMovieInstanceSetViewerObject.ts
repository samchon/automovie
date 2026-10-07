import type * as THREE from "three";
import type { IAutoMovieInstanceSetViewerStats } from "./IAutoMovieInstanceSetViewerStats";

/**
 * Viewer-owned chunked object for a compiled general instance set.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Displays this surface from the formation's selected resolution policy.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements the logical-to-display resolution boundary for instances.
 * @author Samchon
 */
export interface IAutoMovieInstanceSetViewerObject {
  /**
   * Add this group to the current scene.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Displays this surface from the formation's selected resolution policy.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements the logical-to-display resolution boundary for instances.
   */
  object: THREE.Group;

  /**
   * Current LOD and culling accounting.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Displays this surface from the formation's selected resolution policy.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements the logical-to-display resolution boundary for instances.
   */
  stats: IAutoMovieInstanceSetViewerStats;
  /**
   * Recompute chunk visibility for the current camera.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Displays this surface from the formation's selected resolution policy.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements the logical-to-display resolution boundary for instances.
   */
  update(camera: THREE.PerspectiveCamera, viewportHeight: number): void;
}
