import type { IAutoMovieConstructionKnot } from "./IAutoMovieConstructionKnot";

/**
 * A curve in station through named knots: the natural cubic spline of least bending through them, C2 in station.
 *
 * It carries one outline edge, a girth, a fullness share or a departure along a part. Toward an end the part closes in a point (`AutoMovieConstructionPole`) the engine splines it in the root of the distance from that end instead, so the outline meets the axis square to it; the knot at that end must then be 0. Beyond its end knots the curve continues as its straight end tangent.
 *
 * @evidence contracts/common.md#principled-implementation The natural cubic spline is the C2 curve of least bending through its knots, so a few named measurements carry a whole outline and every knot is an input read at its published site.
 * @evidence contracts/common.md#clear-and-simple-design One knot list type serves every curve along a part, its meaning set by the field that holds it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No knot is fitted to a specimen; a knot list that is not strictly increasing is refused, never sorted or merged.
 * @evidence contracts/common.md#meaningful-documentation States the interpolant, its continuity, the change toward a closed end and its zero knot, and the extension past the end knots.
 */
export interface IAutoMovieConstructionOutline {
  /** Knots by strictly increasing station, at least two. */
  knots: IAutoMovieConstructionKnot[];
}
