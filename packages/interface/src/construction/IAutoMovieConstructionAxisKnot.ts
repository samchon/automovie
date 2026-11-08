import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One knot of a curved axis: the course's point at a station.
 *
 * @evidence contracts/development/design.md#principled-representation The course passes through each knot at its station, so the stations of the part's outlines and of its course agree.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A station and a point are all a course knot needs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The point is authored, not projected from a mesh.
 * @evidence contracts/development/common.md#meaningful-documentation States the station's and the point's units and frame.
 */
export interface IAutoMovieConstructionAxisKnot {
  /** Station, metres, strictly increasing over the course's knots. */
  station: number;

  /** The course's point there, metres in the construction's frame. */
  point: IAutoMovieVector3;
}
