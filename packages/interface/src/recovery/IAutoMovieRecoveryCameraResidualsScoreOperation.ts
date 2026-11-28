/** Callable inclusive scoring of finite absolute pixel residuals. */

export namespace IAutoMovieRecoveryCameraResidualsScoreOperation {
  /**
   * Require a finite positive threshold in pixels. Return original input
   * indices for finite magnitudes at or below it and the median and ninetieth
   * percentile of that accepted population. An empty population has null
   * statistics.
   */

  export type Operation = (
    residuals: readonly (number | null)[],
    thresholdPx: number,
  ) => {
    /**
     * Indices of finite residuals within the inclusive threshold, in original
     * order.
     */
    indices: number[];
    /**
     * Median accepted residual magnitude in pixels, or null when support is
     * empty.
     */
    medianPx: number | null;
    /**
     * Linearly interpolated 90th percentile of accepted magnitudes in pixels,
     * or null when support is empty.
     */
    p90Px: number | null;
  };
}
