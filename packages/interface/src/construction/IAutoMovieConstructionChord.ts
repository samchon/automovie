/**
 * A constant chord from a join's curve to one rail.
 *
 * @evidence contracts/common.md#principled-implementation The rail stands this straight distance from every curve point, on its surface in the normal section.
 * @evidence contracts/common.md#clear-and-simple-design One number for a blend of even width.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A chord that is not positive leaves no rail and is reported.
 * @evidence contracts/common.md#meaningful-documentation States the unit, the range and its failure effect.
 */
export interface IAutoMovieConstructionChord {
  /** Discriminator. */
  type: "chord";

  /** The chord, metres, positive. */
  value: number;
}
