/** Shared original weighted-design column norms for one current metric model. */
export interface IAutoMovieRecoveryMapMetricScales {
  /** Positive finite original weighted-design camera column norms. */
  readonly cameraScales: readonly number[];

  /**
   * Positive finite original weighted-design three-column norms per ordered
   * point.
   */
  readonly pointScales: readonly (readonly number[])[];
}
