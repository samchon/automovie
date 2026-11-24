import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanHandDigitLaw; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanHandDigitLaw {
  /** Caller-owned digit section anchors and tip shape in the hand chart. */
  export interface IDigitSource {
    /** Number of points around the generated root. */
    order: number;

    /**
     * Distance beyond the root where its section gives way to the anchors,
     * millimetres.
     */
    blend: number;

    /** Tip position in the caller's hand chart, millimetres. */
    pole: readonly [number, number, number];

    /** Tip-to-root rows of centre, half width and half depth, millimetres. */
    anchors: readonly (readonly number[])[];
  }

  /**
   * Result of AutoMovieHumanHandDigitLaw.digitAxes. Axes across a digit's line:
   * toward the thumb's side and through the hand.
   */
  export type DigitAxesResult = [AutoMovieVector3Tuple, AutoMovieVector3Tuple];

  /**
   * The start argument of AutoMovieHumanHandDigitLaw.digit. A digit's law from
   * its anchors and its root.
   *
   * @param root Its first ring at the web, for its centre and the sense its
   *   phase turns.
   */
  export type IDigitStart = {
    /** Digit's root centre in the registered frame, millimetres. */
    centre: AutoMovieVector3Tuple;
    /** Root half breadth in the digit's section chart, millimetres. */
    width: number;
    /** Root half depth in the digit's section chart, millimetres. */
    depth: number;
  } | null;
}
