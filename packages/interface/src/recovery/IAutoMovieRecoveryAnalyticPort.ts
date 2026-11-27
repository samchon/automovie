/** A named saved curve occupying one oriented end of an analytic domain. */

export interface IAutoMovieRecoveryAnalyticPort {
  /** Saved coefficient curve identity. */
  curveName: string;

  /**
   * Lower or upper end in the declared native chart; not a world-space height
   * classification.
   */
  side: "lower" | "upper";
}
