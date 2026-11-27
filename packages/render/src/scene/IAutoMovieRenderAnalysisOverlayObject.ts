import type * as THREE from "three";

/** A viewer-owned field overlay bound to one analysis run. */
export interface IAutoMovieRenderAnalysisOverlayObject {
  /** Add these points to the current scene. */
  object: THREE.Points;

  /** Release the geometry, and the material when this object created it. */
  dispose: () => void;

  /** Points drawn, one per spatial sample of the chosen metric. */
  count: () => number;

  /** The value range the colour ramp was normalized over. */
  range: () => { min: number; max: number };
}
