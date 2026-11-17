import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanHandDigitLaw; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanHandDigitLaw exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups DigitAxesResult, IDigitStart. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanHandDigitLaw; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the DigitAxesResult, IDigitStart contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanHandDigitLaw {
  /** Result of AutoMovieHumanHandDigitLaw.digitAxes. Axes across a digit's line: toward the thumb's side and through the hand.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Axes across a digit's line: toward the thumb's side and through the hand.
   * @evidence contracts/development/design.md#principled-representation Axes across a digit's line: toward the thumb's side and through the hand. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandDigitLaw.DigitAxesResult is the canonical exchange used by AutoMovieHumanHandDigitLaw.digitAxes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHandDigitLaw.digitAxes for axes across a digit's line: toward the thumb's side and through the hand.
   */
  export type DigitAxesResult = [AutoMovieVector3Tuple, AutoMovieVector3Tuple];

  /** The start argument of AutoMovieHumanHandDigitLaw.digit. A digit's law from its anchors and its root.
  @param root Its first ring at the web, for its centre and the sense its phase
    turns.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A digit's law from its anchors and its root.
 * @evidence contracts/development/design.md#principled-representation A digit's law from its anchors and its root. Alternatives are a record with centre, width, depth; null.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandDigitLaw.IDigitStart is the canonical exchange used by AutoMovieHumanHandDigitLaw.digit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHandDigitLaw.digit for a digit's law from its anchors and its root.
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
