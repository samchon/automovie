import type { IAutoMovieConstructionKnot } from "./IAutoMovieConstructionKnot";
import type { IAutoMovieConstructionOutlineParameter } from "./IAutoMovieConstructionOutlineParameter";
import type { IAutoMovieConstructionOutlineRange } from "./IAutoMovieConstructionOutlineRange";

/**
 * A curve through named knots: the natural cubic spline of least bending in its
 * source parameter.
 *
 * It carries an outline edge, girth, fullness share, departure or origin
 * coordinate. Absent an explicit parameter it runs in station, except that a
 * closing part supplies its root/angle pole parameter and separately requires a
 * zero radial knot at each closing end. An explicit world-coordinate parameter
 * can have nonzero endpoint values. Explicit knot jets or a scalar range select
 * C2 quintic Hermite spans; otherwise the natural cubic is unchanged. Beyond
 * source knots it continues as its tangent in the selected parameter; a
 * parameter's finite domain still applies and a range applies only between
 * knots.
 */
export interface IAutoMovieConstructionOutline {
  /** Knots by strictly increasing station, at least two. */
  knots: IAutoMovieConstructionKnot[];

  /**
   * Optional source parameter; nonzero endpoint values are allowed unless the
   * holding part separately requests radial closure.
   */
  parameter?: IAutoMovieConstructionOutlineParameter;

  /**
   * Optional scalar range on the closed source knot span; this does not
   * constrain a moving world frame or open extensions.
   */
  range?: IAutoMovieConstructionOutlineRange;
}
