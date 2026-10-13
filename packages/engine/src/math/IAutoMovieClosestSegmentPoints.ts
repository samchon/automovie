import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The closest pair of points between segments `a→b` and `c→d`, and their
 * distance.
 */
export interface IAutoMovieClosestSegmentPoints {
  /** Point on the first segment. */
  pointA: IAutoMovieVector3;
  /** Point on the second segment. */
  pointB: IAutoMovieVector3;
  /** Distance between the two points. */
  distance: number;
}
