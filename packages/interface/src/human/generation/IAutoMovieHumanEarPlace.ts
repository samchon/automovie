import type { AutoMovieHumanSexPair } from "../AutoMovieHumanSexPair";

/**
 * Ear-top placement regression in millimetres.
 *
 * The interface package owns these declarations; AutoMovieHumanEarPlace in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanEarPlace {
  /** The line on the ear length, women and men, mm. */
  export type AboveTragionOnLength = AutoMovieHumanSexPair<{
    /**
     * Intercept of the table's affine predictor, in the response quantity's
     * documented unit.
     */
    readonly a: number;
    /** Slope of the table's affine predictor, response units per predictor unit. */
    readonly b: number;
  }>;
}
