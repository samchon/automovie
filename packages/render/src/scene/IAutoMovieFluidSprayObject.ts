import type { IAutoMovieFluidSpraySample } from "@automovie/interface";
import type * as THREE from "three";

/**
 * A viewer-owned point cloud for the currently uploaded bounded spray sample;
 * updates do not bind it to a domain identity.
 */
export interface IAutoMovieFluidSprayObject {
  /** Add these points to the current scene. */
  object: THREE.Points;

  /**
   * Re-upload the particles of a newly sampled step; domain is not checked
   * here.
   */
  update: (sample: IAutoMovieFluidSpraySample) => void;

  /** Release the geometry, and the material when this object created it. */
  dispose: () => void;

  /** Particle count in the last upload, after the engine's cap and LOD thinning. */
  count: () => number;
}
