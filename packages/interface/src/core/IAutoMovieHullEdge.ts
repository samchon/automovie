import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The support-hull boundary edge nearest to a query point, as `nearestHullEdge`
 * returns it: the axis an object tips over when its centre of mass leaves the
 * hull across that edge.
 *
 * Distances are measured in the horizontal XZ plane, ignoring height. The
 * endpoints are the hull's own vertex objects, not copies. A single-vertex hull
 * answers a zero-length edge whose endpoints are that vertex.
 */
export interface IAutoMovieHullEdge {
  /** First endpoint of the edge, in world metres; the hull's vertex object. */
  start: IAutoMovieVector3;

  /** Second endpoint of the edge, in world metres; the hull's vertex object. */
  end: IAutoMovieVector3;

  /** Horizontal XZ distance from the query point to this edge, in metres. */
  distance: number;
}
