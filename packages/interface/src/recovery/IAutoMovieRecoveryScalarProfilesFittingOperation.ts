/**
 * Callable fitting of co-charted physical scalar observations into cubic span
 * controls.
 */

export namespace IAutoMovieRecoveryScalarProfilesFittingOperation {
  /**
   * Fit every value column on the same clamped uniform cubic spline design.
   * Give increasing Y stations and finite field values in millimetres, a
   * positive span count, and a rank threshold in (0, 1). Return intervals and
   * Bernstein controls in metres. A weak design or nonrepresentable solve
   * raises an error.
   */

  export type Operation = (
    samples: readonly {
      /** Registered physical Y station in millimetres. */
      yMm: number;
      /**
       * Finite scalar observation values in the caller's field order and
       * millimetres.
       */
      values: readonly number[];
    }[],
    spans: number,
    minimumRankRatio: number,
  ) => {
    /** Fitted cubic spans in ascending physical Y order. */
    spans: {
      /** Lower and upper span endpoints in metres. */
      interval: [number, number];

      /** Four Bernstein controls in metres for each field, in input field order. */
      profiles: [number, number, number, number][];
    }[];

    /** Smallest-to-largest magnitude of the spline QR diagonal. */
    rankRatio: number;
  };
}
