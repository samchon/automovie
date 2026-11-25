/**
 * A named locus at one original clock value along a profile piece.
 *
 * Piece names an existing family piece; clock uses that original curve's
 * parameter and lies in its retained interval. Profile preparation resolves the
 * source, so the guide follows the original station-varying curve rather than
 * an observed display polyline.
 */
export interface IAutoMovieConstructionProfileGuide {
  /** Guide identity used by source constraints and editor selections. */
  id: string;

  /** Existing piece identity. */
  piece: string;

  /** Fixed original clock inside that piece's interval, in the owner's units. */
  clock: number;
}
