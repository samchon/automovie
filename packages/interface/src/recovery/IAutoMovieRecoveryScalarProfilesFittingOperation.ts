/**
 * Fit co-charted scalar profiles in one clamped uniform cubic B-spline space.
 * Unpivoted Householder QR acts on the original design and all right-hand
 * sides; the diagonal ratio is an operational rank test, not a certified
 * condition. Endpoint values and derivatives convert each polynomial interval
 * exactly to Bernstein controls before binary64 rounding. Input
 * coordinates/values use millimetres; returned physical intervals and controls
 * use metres.
 */

export namespace IAutoMovieRecoveryScalarProfilesFittingOperation {
  /**
   * Fit co-charted scalar profiles in one clamped uniform cubic B-spline space.
   * Unpivoted Householder QR acts on the original design and all right-hand
   * sides; the diagonal ratio is an operational rank test, not a certified
   * condition. Endpoint values and derivatives convert each polynomial interval
   * exactly to Bernstein controls before binary64 rounding. Input
   * coordinates/values use millimetres; returned physical intervals and
   * controls use metres.
   */

  export type Operation = (
    samples: readonly {
      /**
       * Vertical observation station in the declared registered millimetre
       * chart.
       */
      yMm: number;
      /**
       * Observed scalar profile values in the declared physical chart, aligned
       * with the station.
       */
      values: readonly number[];
    }[],
    spans: number,
    minimumRankRatio: number,
  ) => {
    /** Fitted cubic scalar spans in increasing physical station order. */
    spans: {
      /**
       * Ordinal of the adjacent saved-plane interval in the complete
       * observation sequence.
       */
      interval: [number, number];

      /**
       * Cubic Bernstein scalar controls in profile order, each with four
       * coefficients.
       */
      profiles: [number, number, number, number][];
    }[];

    /**
     * Dimensionless observed design singular ratio for the fitted
     * scalar/profile system.
     */
    rankRatio: number;
  };
}
