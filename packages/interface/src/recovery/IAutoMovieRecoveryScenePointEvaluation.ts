/**
 * Pointwise qualification and available measurements over a landmark's retained
 * registered-camera observations.
 */
export interface IAutoMovieRecoveryScenePointEvaluation {
  /** True only when all required per-observation and per-point checks pass. */
  accepted: boolean;

  /** Distinct qualification failures observed while evaluating this point. */
  reasons: string[];

  /**
   * Largest available Euclidean pixel residual, with zero as the initial
   * maximum. Null when a retained projection is unavailable or the residual
   * overflows.
   */
  maximumReprojectionPx: number | null;

  /**
   * Smallest resolved positive camera-frame Z in map-scale units, or null if no
   * projection resolves.
   */
  minimumDepth: number | null;

  /**
   * Original source indices of the retained ray pair with the largest acute
   * angle, or null without a resolved pair.
   */
  supportingViews: [number, number] | null;

  /**
   * Largest acute angle between actual retained camera rays, in degrees, or
   * null without a resolved pair.
   */
  acuteParallaxDegrees: number | null;
}
