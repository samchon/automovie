/**
 * A named locus at one original clock value along a profile piece.
 *
 * piece names an existing family piece; clock uses that original curve's parameter and lies in its retained interval. Profile preparation resolves the source, so the guide follows the original station-varying curve rather than an observed display polyline.
 *
 * @evidence contracts/development/design.md#principled-representation A piece reference and fixed source clock identify a locus throughout the piece's physical station domain.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Source constraints and geometry selections share a stable guide identity without copying sampled positions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration does not fit a locus to output geometry or invent missing source derivatives.
 * @evidence contracts/development/common.md#meaningful-documentation Defines piece membership, source parameter units and original-curve ownership.
 */
export interface IAutoMovieConstructionProfileGuide {
  /** Guide identity used by source constraints and editor selections. */
  id: string;

  /** Existing piece identity. */
  piece: string;

  /** Fixed original clock inside that piece's interval, in the owner's units. */
  clock: number;
}
