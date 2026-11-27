/**
 * Collect finite absolute residuals within an inclusive pixel threshold.
 * Returned indices preserve observation order; quantiles use linear
 * interpolation at (N-1)*q. Empty support has null diagnostics, never a perfect
 * zero error.
 */

export namespace IAutoMovieRecoveryCameraResidualsScoreOperation {
  /**
   * Collect finite absolute residuals within an inclusive pixel threshold.
   * Returned indices preserve observation order; quantiles use linear
   * interpolation at (N-1)*q. Empty support has null diagnostics, never a
   * perfect zero error.
   */

  export type Operation = (
    residuals: readonly (number | null)[],
    thresholdPx: number,
  ) => {
    /**
     * Original correspondence ordinals passing the declared residual gate, in
     * stable input order.
     */
    indices: number[];
    /**
     * Median accepted residual in pixels, or null for an empty accepted
     * population.
     */
    medianPx: number | null;
    /**
     * Ninetieth-percentile accepted residual in pixels, or null for an empty
     * accepted population.
     */
    p90Px: number | null;
  };
}
