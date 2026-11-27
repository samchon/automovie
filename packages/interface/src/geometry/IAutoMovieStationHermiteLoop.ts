import type { IAutoMoviePlanarHermiteKnot } from "./IAutoMoviePlanarHermiteKnot";

/**
 * One station's reduced closed loop, as `AutoMovieEngineMeshExtract.reduceLoop`
 * returns it, at its station: the input of
 * `AutoMovieEngineMeshExtract.profileCurve`.
 *
 * ProfileCurve borrows this record during preparation and copies coordinates
 * into its closure. At least two stations in increasing order are required;
 * finite coordinates and consistent positive loop periods remain caller
 * obligations.
 */
export interface IAutoMovieStationHermiteLoop {
  /** The station, millimetres along the frame axis. */
  station: number;

  /**
   * The loop's knots (points in the section's `[a, b]` millimetres about the
   * station's axis point) and its chord length.
   */
  loop: {
    /**
     * Periodic Hermite knots in section [a,b] millimetres; profileCurve
     * requires at least three, normalizes winding and copies their
     * coordinates.
     */
    knots: readonly IAutoMoviePlanarHermiteKnot[];

    /**
     * Positive finite period in millimetres, including the closing chord;
     * consistent increasing knot parameters are caller premises, not separately
     * admitted by profileCurve.
     */
    length: number;
  };
}
