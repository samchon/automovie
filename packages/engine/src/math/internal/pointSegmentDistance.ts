import { IAutoMovieVector3 } from "@automovie/interface";

import { closestPointsBetweenSegments } from "./closestPointsBetweenSegments";

/*
 * Distance in metres from a point to a closed segment in one coordinate frame.
 * Coincident endpoints give point distance without collapsing tiny nonzero
 * spans. The shared segment owner admits finite represented arithmetic and
 * reports rounded witnesses rather than a certified exact separation bound.
 */
export function pointSegmentDistance(
  point: IAutoMovieVector3,
  start: IAutoMovieVector3,
  end: IAutoMovieVector3,
): number {
  return closestPointsBetweenSegments(point, point, start, end).distance;
}
