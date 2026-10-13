/** Renderer-independent shadow map controls shared by physical lights. */
export interface IAutoMovieLightShadow {
  /** Square shadow-map resolution, a positive safe integer. */
  mapSize: number;

  /** Depth bias used to suppress surface acne. */
  bias: number;

  /** Normal-relative depth bias. */
  normalBias: number;

  /** Positive shadow-camera near distance. */
  near: number;

  /** Shadow-camera far distance, greater than `near`. */
  far: number;
}
