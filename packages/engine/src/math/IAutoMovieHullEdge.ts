import { IAutoMovieVector3 } from "@automovie/interface";

/** One hull boundary edge and the point's distance to it. */
export interface IAutoMovieHullEdge {
  /** First endpoint of the hull edge. */
  start: IAutoMovieVector3;
  /** Second endpoint of the hull edge. */
  end: IAutoMovieVector3;
  /** Shortest planar distance from the query point to this edge. */
  distance: number;
}
