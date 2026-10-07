import type * as THREE from "three";
import type { IAutoMovieInstanceSetViewerStats } from "./IAutoMovieInstanceSetViewerStats";

/**
 * Viewer-owned chunked object for a compiled general instance set.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Projects the compiled instance-set tier policy into persistent batch visibility and accounting.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-bounds-framing-culling-failures Keeps instance-set LOD and culling state separate from authored visibility and compact member identity.
 * @author Samchon
 */
export interface IAutoMovieInstanceSetViewerObject {
  /**
   * Add this group to the current scene.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Projects the compiled instance-set tier policy into persistent batch visibility and accounting.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-bounds-framing-culling-failures Keeps instance-set LOD and culling state separate from authored visibility and compact member identity.
   */
  object: THREE.Group;

  /**
   * Current LOD and culling accounting.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Projects the compiled instance-set tier policy into persistent batch visibility and accounting.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-bounds-framing-culling-failures Keeps instance-set LOD and culling state separate from authored visibility and compact member identity.
   */
  stats: IAutoMovieInstanceSetViewerStats;
  /**
   * Recompute chunk visibility for the current camera.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Projects the compiled instance-set tier policy into persistent batch visibility and accounting.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-bounds-framing-culling-failures Keeps instance-set LOD and culling state separate from authored visibility and compact member identity.
   */
  update(camera: THREE.PerspectiveCamera, viewportHeight: number): void;
}
