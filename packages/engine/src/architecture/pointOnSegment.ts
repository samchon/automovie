import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { PLANAR_EPSILON } from "../geometry/constants/PLANAR_EPSILON";
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
 *
 * @evidence contracts/common.md#principled-implementation Collinearity by the orientation predicate plus a bounding-box test is the standard exact-arithmetic recipe for point-on-segment; the box is widened by the same epsilon so a vertex computed with rounding still lands on its edge.
 * @evidence contracts/common.md#clear-and-simple-design One definition of "on an edge" for `pointInPolygon` and `segmentsTouch`, which previously kept separate copies of it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate or caller is special-cased; the slack is the shared `PLANAR_EPSILON` constant.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the two conditions, the box slack, the zero-length case, and each parameter's frame.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant time, one orientation test and four comparisons, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure point-on-segment predicate that each polygon test calls per edge; nothing is coordinated across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads one point and one segment and allocates nothing, so nothing outlives the call.
 */
export const pointOnSegment = (
  point: IAutoMoviePlanarPoint,
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
): boolean =>
  planarSide(from, to, point) === 0 &&
  point.x >= Math.min(from.x, to.x) - PLANAR_EPSILON &&
  point.x <= Math.max(from.x, to.x) + PLANAR_EPSILON &&
  point.y >= Math.min(from.y, to.y) - PLANAR_EPSILON &&
  point.y <= Math.max(from.y, to.y) + PLANAR_EPSILON;
