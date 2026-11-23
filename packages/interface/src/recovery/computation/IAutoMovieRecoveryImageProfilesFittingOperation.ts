import type { IAutoMovieEllipticLoft } from "../../index";

/**
 * Fit the aligned ellipse's four scalar fields with shared cubic algebra.
 * Radius Bernstein controls must all remain positive; this sufficient
 * whole-span condition rejects a candidate instead of clamping its fitted
 * field.
 */

export namespace IAutoMovieRecoveryImageProfilesFittingOperation {
  /**
   * Fit the aligned ellipse's four scalar fields with shared cubic algebra.
   * Radius Bernstein controls must all remain positive; this sufficient
   * whole-span condition rejects a candidate instead of clamping its fitted
   * field.
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
      values: [number, number, number, number];
    }[],
    spans: number,
    minimumRankRatio: number,
  ) => {
    /**
     * Fitted elliptic loft in the declared physical chart; numerical rank and
     * source-fit qualifications remain separate.
     */
    loft: IAutoMovieEllipticLoft;
    /**
     * Dimensionless observed design singular ratio for the fitted
     * scalar/profile system.
     */
    rankRatio: number;
  };
}
