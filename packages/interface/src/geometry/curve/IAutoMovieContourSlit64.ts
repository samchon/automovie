import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Finite-segment projection used by contour correspondence and slit selection.
 *
 * @evidence contracts/development/design.md#principled-representation Projection retains input Cartesian units and a dimensionless clamped segment fraction.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IClosestResult carries the point, fraction and distance read by slit joins and correspondence scoring.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Coincident endpoints remain degenerate segments without invented direction.
 * @evidence contracts/development/common.md#meaningful-documentation The result documents fresh point ownership and finite-arithmetic premises.
 */
export namespace IAutoMovieContourSlit64 {
  /**
   * Projection onto a finite segment; a zero-length segment remains its endpoint.
   * Finite representable projection arithmetic is a caller premise; closest does
   * not validate inputs or certify a distance bound under overflow.
   *
   * @evidence contracts/development/design.md#principled-representation A projected point, dimensionless clamped segment fraction and distance preserve the supplied Cartesian frame and length unit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieContourSlit64.closest supplies the same projection to slit joins and contour separation scoring.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A degenerate segment uses its endpoint, with no invented direction or infinite-line extrapolation.
   * @evidence contracts/development/common.md#meaningful-documentation States projection ownership, units, fraction range and finite-arithmetic premise.
   */
  export type IClosestResult = {
    /** Newly allocated projected point a + t*(b-a), in the supplied frame and length unit. */
    p: AutoMovieVector3Tuple;

    /** Dimensionless segment fraction clamped to [0,1]; zero for coincident endpoints under finite arithmetic. */
    t: number;

    /** Euclidean separation from the query point to p, in the input length unit, not squared distance. */
    distance: number;
  };
}
