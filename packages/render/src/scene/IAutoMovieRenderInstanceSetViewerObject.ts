import type * as THREE from "three";

import type { IAutoMovieRenderInstanceSetViewerStats } from "./IAutoMovieRenderInstanceSetViewerStats";

/** Viewer-owned chunked object for a compiled general instance set. */
export interface IAutoMovieRenderInstanceSetViewerObject {
  /** Add this group to the current scene. */
  object: THREE.Group;

  /** Current LOD and culling accounting. */
  stats: IAutoMovieRenderInstanceSetViewerStats;

  /**
   * Detach and retire instance geometry, prototype geometry and owned material
   * clones once. Borrowed prototype inputs survive. A failure is preserved for
   * repeated callers, and disposed runtimes refuse further updates.
   */
  dispose(): void;

  /** Recompute chunk visibility for the current camera. */
  update(camera: THREE.PerspectiveCamera, viewportHeight: number): void;
}
