import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanDigitLine; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanDigitLine {
  /** One bone of the line. */
  export interface ILeg {
    /** Unit direction. */
    direction: AutoMovieVector3Tuple;

    /** Length along the arc, mm. */
    length: number;

    /**
     * Half length of the turn onto the next leg at this leg's distal joint, mm;
     * ignored on the last leg.
     */
    turn: number;
  }

  /** A built line. */
  export interface ILine {
    /** Points from the start, one every {@link ILine.step}. */
    points: AutoMovieVector3Tuple[];

    /** Spacing of the points along the arc. */
    step: number;

    /** Arc length of the whole line. */
    length: number;

    /** Arc length of each leg's distal end: the joints, then the line's end. */
    joints: number[];

    /** Point at an arc length, clamped to the line. */
    at: (s: number) => AutoMovieVector3Tuple;

    /** Unit tangent at an arc length. */
    tangent: (s: number) => AutoMovieVector3Tuple;
  }
}
