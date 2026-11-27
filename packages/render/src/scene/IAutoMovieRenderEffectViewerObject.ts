import type * as THREE from "three";

import type { IAutoMovieRenderEffectViewerStats } from "./IAutoMovieRenderEffectViewerStats.js";

/** Built deterministic billboard emitter. */
export interface IAutoMovieRenderEffectViewerObject {
  /** Add this mesh to the shot scene. */
  object: THREE.InstancedMesh;

  /** Current bounded effect summary. */
  stats: IAutoMovieRenderEffectViewerStats;

  /** Sample one absolute shot time and face particles toward the camera. */
  update(camera: THREE.PerspectiveCamera, time: number): void;
}
