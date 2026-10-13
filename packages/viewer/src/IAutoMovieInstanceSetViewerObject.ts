import type * as THREE from "three";

import type { IAutoMovieInstanceSetViewerStats } from "./IAutoMovieInstanceSetViewerStats.js";

/**
 * Viewer-owned chunked object for a compiled general instance set.
 *
 * @author Samchon
 */
export interface IAutoMovieInstanceSetViewerObject {
  /** Add this group to the current scene. */
  object: THREE.Group;

  /** Current LOD and culling accounting. */
  stats: IAutoMovieInstanceSetViewerStats;

  /** Recompute chunk visibility for the current camera. */
  update(camera: THREE.PerspectiveCamera, viewportHeight: number): void;
}
