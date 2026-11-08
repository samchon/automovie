import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The support-hull boundary edge nearest to a query point, as
 * `nearestHullEdge` returns it: the axis an object tips over when its centre of
 * mass leaves the hull across that edge.
 *
 * Distances are measured in the horizontal XZ plane, ignoring height. The
 * endpoints are the hull's own vertex objects, not copies. A single-vertex
 * hull answers a zero-length edge whose endpoints are that vertex.
 *
 * @evidence contracts/development/design.md#principled-representation Records the edge minimising the planar point-to-segment distance over the hull's boundary, the hinge `detectSupportToppling` reports for a centre of mass outside the hull; it premises a hull listed in boundary order.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two endpoints and the distance, what the toppling check and `pointHullDistance` read; no edge index is kept because no consumer needs it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A plain result record with no caller-specific field; the single-vertex answer is the stated degenerate case, not a compensation.
 * @evidence contracts/development/common.md#meaningful-documentation States what the edge means for toppling, that distance is planar in XZ, that endpoints alias the hull's vertices, and the single-vertex case.
 */
export interface IAutoMovieHullEdge {
  /** First endpoint of the edge, in world metres; the hull's vertex object. */
  start: IAutoMovieVector3;

  /** Second endpoint of the edge, in world metres; the hull's vertex object. */
  end: IAutoMovieVector3;

  /** Horizontal XZ distance from the query point to this edge, in metres. */
  distance: number;
}
