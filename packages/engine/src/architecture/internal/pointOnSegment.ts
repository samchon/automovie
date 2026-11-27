import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { AutoMovieEnginePlanarEpsilon } from "../../geometry/AutoMovieEnginePlanarEpsilon";
import { planarSide } from "./planarSide";

/*
 * Whether a point lies on a closed segment, its endpoints included.
 *
 * The point must be collinear by planarSide and inside the segment's
 * axis-aligned box widened by `AutoMovieEnginePlanarEpsilon` (1e-12) on every side. A
 * zero-length segment therefore contains exactly the points within that slack
 * of its one position.
 * Parameter point: Point to test, in the caller's planar frame.
 * Parameter from: One endpoint of the segment, in the same frame.
 * Parameter to: The other endpoint, in the same frame.
 * Returns: True when the point is on the segment within the stated tolerance.
 */
export function pointOnSegment(
  point: IAutoMoviePlanarPoint,
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
): boolean {
  return (
    planarSide(from, to, point) === 0 &&
    point.x >= Math.min(from.x, to.x) - AutoMovieEnginePlanarEpsilon &&
    point.x <= Math.max(from.x, to.x) + AutoMovieEnginePlanarEpsilon &&
    point.y >= Math.min(from.y, to.y) - AutoMovieEnginePlanarEpsilon &&
    point.y <= Math.max(from.y, to.y) + AutoMovieEnginePlanarEpsilon
  );
}
