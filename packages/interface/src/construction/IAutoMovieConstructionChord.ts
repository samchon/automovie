/**
 * A constant chord from a join's curve to one rail.
 *
 * @evidence contracts/development/design.md#principled-representation The rail stands this straight distance from every curve point, on its surface in the normal section.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One number for a blend of even width.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A chord that is not positive leaves no rail and is reported.
 * @evidence contracts/development/common.md#meaningful-documentation States the unit, the range and its failure effect.
 */
export interface IAutoMovieConstructionChord {
  /** Discriminator. */
  type: "chord";

  /** The chord, metres, positive. */
  value: number;
}
