import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanThumbBones; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanThumbBones exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups OfMap. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanThumbBones; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the OfMap contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanThumbBones {
  /** The map argument of AutoMovieHumanThumbBones.of. Build the thumb's bones and skin law.
  @param d The thumb's law in the hand form's axes.
  @param joints The hand's joints, left frame, mm.
  @param hand The hand's solved scales, with the thumb length.
  @param map The hand's map from the form's axes to the left frame.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Build the thumb's bones and skin law.
 * @evidence contracts/development/design.md#principled-representation Build the thumb's bones and skin law. The callable takes q and returns AutoMovieVector3Tuple.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanThumbBones.OfMap is the canonical exchange used by AutoMovieHumanThumbBones.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanThumbBones.of for build the thumb's bones and skin law.
 */
  export type OfMap = (
    q: readonly [number, number, number],
  ) => AutoMovieVector3Tuple;
}
