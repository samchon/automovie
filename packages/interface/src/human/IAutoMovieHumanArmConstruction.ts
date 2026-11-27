import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanDigitCentreLine } from "./IAutoMovieHumanDigitCentreLine";
import type { IAutoMovieHumanHandMeasures } from "./IAutoMovieHumanHandMeasures";

/**
 * Type contracts exchanged by AutoMovieHumanArmConstruction; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanArmConstruction {
  /** What an arm reads. */
  export interface IInputs {
    /** Upper arm length. */
    upper: number;

    /** Lower arm length. */
    lower: number;

    /** Biceps tape. */
    bicep: number;

    /** Elbow tape. */
    elbow: number;

    /** Forearm tape. */
    forearm: number;

    /** Wrist tape. */
    wrist: number;

    /** Hand tape. */
    circumference: number;

    /** Masculine-feminine control. */
    sex: number;

    /** Left hand. */
    left: IAutoMovieHumanHandMeasures;

    /** Right hand. */
    right: IAutoMovieHumanHandMeasures;

    /** Calibration millimetres per world millimetre. */
    scale: number;
  }

  /**
   * One side's bone landmarks by the arm's law, in world millimetres, before
   * any arm skin exists: what a skeleton stands its arm and hand on.
   */
  export interface IBones {
    /** The elbow centre. */
    elbow: AutoMovieVector3Tuple;

    /**
     * Centre of the hand's section at the wrist crease. Hand length runs from
     * the crease, and the hand's origin-to-tip measure is `lengthRatio` of it,
     * so the crease lies the rest of that length behind the origin.
     */
    crease: AutoMovieVector3Tuple;

    /** Hand length the hand was made to, from the crease. */
    length: number;

    /** The thumb's carpometacarpal and metacarpophalangeal joints. */
    thumb: {
      /**
       * Thumb carpometacarpal joint centre in the body's registered frame,
       * millimetres.
       */
      cmc: AutoMovieVector3Tuple;
      /**
       * Thumb metacarpophalangeal joint centre in the body's registered frame,
       * millimetres.
       */
      mcp: AutoMovieVector3Tuple;
    };

    /** Each digit's centre line from its web to its tip, thumb first. */
    digits: IAutoMovieHumanDigitCentreLine[];
  }
}
