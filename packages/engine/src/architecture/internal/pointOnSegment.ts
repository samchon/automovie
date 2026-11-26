import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { PLANAR_EPSILON } from "../../geometry/constants/PLANAR_EPSILON";
import { planarSide } from "./planarSide";

/**
 * Whether a point lies on a closed segment, its endpoints included.
 *
 * The point must be collinear by {@link planarSide} and inside the segment's
 * axis-aligned box widened by `PLANAR_EPSILON` (1e-12) on every side. A
 * zero-length segment therefore contains exactly the points within that slack
 * of its one position.
 *
 * @param point Point to test, in the caller's planar frame.
 * @param from One endpoint of the segment, in the same frame.
 * @param to The other endpoint, in the same frame.
 * @returns True when the point is on the segment within the stated tolerance.
 */
export function pointOnSegment(
  point: IAutoMoviePlanarPoint,
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
): boolean {
  return (
    planarSide(from, to, point) === 0 &&
    point.x >= Math.min(from.x, to.x) - PLANAR_EPSILON &&
    point.x <= Math.max(from.x, to.x) + PLANAR_EPSILON &&
    point.y >= Math.min(from.y, to.y) - PLANAR_EPSILON &&
    point.y <= Math.max(from.y, to.y) + PLANAR_EPSILON
  );
}
