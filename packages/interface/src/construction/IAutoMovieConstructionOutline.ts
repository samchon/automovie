import type { AutoMovieConstructionOutlineParameter } from "./AutoMovieConstructionOutlineParameter";
import type { IAutoMovieConstructionKnot } from "./IAutoMovieConstructionKnot";
import type { IAutoMovieConstructionOutlineRange } from "./IAutoMovieConstructionOutlineRange";

/**
 * A curve through named knots: the natural cubic spline of least bending in its source parameter.
 *
 * It carries an outline edge, girth, fullness share, departure or origin coordinate. Absent an explicit parameter it runs in station, except that a closing part supplies its root/angle pole parameter and separately requires a zero radial knot at each closing end. An explicit world-coordinate parameter can have nonzero endpoint values. Explicit knot jets or a scalar range select C2 quintic Hermite spans; otherwise the natural cubic is unchanged. Beyond source knots it continues as its tangent in the selected parameter; a parameter's finite domain still applies and a range applies only between knots.
 *
 * @evidence contracts/common.md#principled-implementation The default natural spline is C2 and least bending in its selected parameter. Authored shared value/first/second knot jets define C2 quintic spans; an explicit range uses the documented sufficient control-hull filter. Station jets can be singular at a parameter endpoint and radial zero closure is separate.
 * @evidence contracts/common.md#clear-and-simple-design One knot list type serves every curve along a part, its meaning set by the field that holds it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No knot is fitted to a specimen; a knot list that is not strictly increasing is refused, never sorted or merged.
 * @evidence contracts/common.md#meaningful-documentation States source parameter, scalar meanings, separate radial zero closure, nonzero world endpoints and parameter-tangent extension.
 */
export interface IAutoMovieConstructionOutline {
  /** Knots by strictly increasing station, at least two. */
  knots: IAutoMovieConstructionKnot[];

  /** Optional source parameter; nonzero endpoint values are allowed unless the holding part separately requests radial closure. */
  parameter?: AutoMovieConstructionOutlineParameter;

  /** Optional scalar range on the closed source knot span; this does not constrain a moving world frame or open extensions. */
  range?: IAutoMovieConstructionOutlineRange;
}
