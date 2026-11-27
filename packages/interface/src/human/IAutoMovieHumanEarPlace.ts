import type { AutoMovieHumanSexPair } from "./AutoMovieHumanSexPair";

/**
 * Ear placement regressions and fore-aft offsets, distinguishing head-length
 * fractions from millimetre results.
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

  /**
   * The ear's fore-aft place at the tragion's height, forward of the skull's
   * centre (the midpoint of the midline's front and back where they stand
   * farthest apart) per head length: the rim's most anterior point and the mean
   * of the rim's points. Estimated from the private reference set; no published
   * source found: `test_human_estimate_nasion_ear` reads -0.0996 (SD 0.0068)
   * and -0.1406 (SD 0.0215) on eight ears of four people.
   */
  export type IForward = {
    /**
     * Rim's most anterior position relative to the skull's centre; positive is
     * forward. IForward stores a dimensionless fraction of head length;
     * IForwardResult stores millimetres.
     */
    readonly front: number;
    /**
     * Mean rim position relative to the skull's centre; positive is forward.
     * IForward stores a dimensionless fraction of head length; IForwardResult
     * stores millimetres.
     */
    readonly centre: number;
  };

  /**
   * Result of AutoMovieHumanEarPlace.forward. The ear's fore-aft place at the
   * tragion's height.
   *
   * @param head The head's measures, for its length.
   * @returns The rim's front and centre forward of the skull's centre, mm
   *   (negative behind it).
   */
  export type IForwardResult = {
    /**
     * Rim's most anterior position relative to the skull's centre; positive is
     * forward. IForward stores a dimensionless fraction of head length;
     * IForwardResult stores millimetres.
     */
    front: number;
    /**
     * Mean rim position relative to the skull's centre; positive is forward.
     * IForward stores a dimensionless fraction of head length; IForwardResult
     * stores millimetres.
     */
    centre: number;
  };
}
