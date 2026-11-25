import type * as THREE from "three";

import type { IAutoMovieEffectViewerStats } from "./IAutoMovieEffectViewerStats.js";

/** Built deterministic billboard emitter. */
export interface IAutoMovieEffectViewerObject {
  /** Add this mesh to the shot scene. */
  object: THREE.InstancedMesh;

  /** Current bounded effect summary. */
  stats: IAutoMovieEffectViewerStats;

  /** Sample one absolute shot time and face particles toward the camera. */
  update(camera: THREE.PerspectiveCamera, time: number): void;
}
