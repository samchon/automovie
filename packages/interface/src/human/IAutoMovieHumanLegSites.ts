import type { AutoMovieHumanSexPair } from "./AutoMovieHumanSexPair";

/**
 * Type contracts exchanged by AutoMovieHumanLegSites; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanLegSites {
  /**
   * Thigh clearance on the proximal thigh girth, women and men, mm: R2 0.66 and
   * 0.74, residual SD 7.0 and 6.4 mm.
   */
  export type ThighDepthOnThigh = AutoMovieHumanSexPair<{
    /**
     * Intercept of the table's affine predictor, in the response quantity's
     * documented unit.
     */
    readonly a: number;
    /** Slope of the table's affine predictor, response units per predictor unit. */
    readonly b: number;
  }>;
}
