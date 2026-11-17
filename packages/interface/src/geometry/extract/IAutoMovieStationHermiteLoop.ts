import type { IAutoMoviePlanarHermiteKnot } from "./IAutoMoviePlanarHermiteKnot";

/**
 * One station's reduced closed loop, as `AutoMovieMeshExtract.reduceLoop` returns it, at
 * its station: the input of `AutoMovieMeshExtract.profileCurve`.
 *
 * profileCurve borrows this record during preparation and copies coordinates into its closure. At least two stations in increasing order are required; finite coordinates and consistent positive loop periods remain caller obligations.
 *
 * @evidence contracts/development/design.md#principled-representation Pairs a periodic Hermite knot loop with the station of the plane it lies in.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reduceLoop result is taken as it is, so a modeler's corrected knots pass in the same shape.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no admission; profileCurve checks the station order and knot count.
 * @evidence contracts/development/common.md#meaningful-documentation States the coordinates the points are in.
 */
export interface IAutoMovieStationHermiteLoop {
  /** The station, millimetres along the frame axis. */
  station: number;

  /** The loop's knots (points in the section's `[a, b]` millimetres about the station's axis point) and its chord length. */
  loop: {
    /**
     * Periodic Hermite knots in section [a,b] millimetres; profileCurve requires at least three, normalizes winding and copies their coordinates.
     */
    knots: readonly IAutoMoviePlanarHermiteKnot[];

    /**
     * Positive finite period in millimetres, including the closing chord; consistent increasing knot parameters are caller premises, not separately admitted by profileCurve.
     */
    length: number;
  };
}
