import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { PLANAR_EPSILON } from "../geometry/constants/PLANAR_EPSILON";

/**
 * Whether a closed polygon never crosses or touches itself away from a shared
 * corner.
 *
 * A self-crossing outline has no interior, so every later question about what
 * is inside it would answer arbitrarily. Adjacent edges are skipped because
 * they legitimately meet at the corner they share.
 *
 * Contact uses the same scale-relative `PLANAR_EPSILON` tolerance as the other
 * planar predicates, so a vertex lying on a non-adjacent edge counts as
 * touching. The point count is not checked: a two-point ring is reported
 * simple, and callers test area or point count separately.
 *
 * @evidence contracts/common.md#principled-implementation Tests every non-adjacent edge pair for any shared point, a proper crossing or an endpoint on the other segment, using a tolerant orientation sign; a ring is simple exactly when no such pair touches.
 * @evidence contracts/common.md#clear-and-simple-design A direct pairwise test with no sweep structure, sized for authored outlines; the private `side`, `segmentsCross`, `segmentsTouch` and `pointOnSegment` helpers are duplicated in `polygonsOverlap` and partly in `pointInPolygon` and `polygonInside`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The only exemption is the adjacent-edge pair, including the wrap-around pair, which share a corner by construction; no outline is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States why simplicity matters, the adjacent-edge exemption, the contact tolerance, and that a degenerate two-point ring is not refused here.
 * @evidence contracts/performance.md#cost-and-resources O(n²) segment tests for n vertices with an early exit on the first contact; Shamos–Hoey would be O(n log n), but authored outlines are small, and the test allocates, caches and retains nothing.
 */
export const polygonIsSimple = (
  polygon: readonly IAutoMoviePlanarPoint[],
): boolean => {
  const count = polygon.length;
  for (let left = 0; left < count; ++left)
    for (let right = left + 1; right < count; ++right) {
      const adjacent =
        right === left + 1 || (left === 0 && right === count - 1);
      if (adjacent) continue;
      if (
        segmentsTouch(
          polygon[left]!,
          polygon[(left + 1) % count]!,
          polygon[right]!,
          polygon[(right + 1) % count]!,
        )
      )
        return false;
    }
  return true;
};

/** Whether two segments meet at a point interior to both. */
const segmentsCross = (
  a: IAutoMoviePlanarPoint,
  b: IAutoMoviePlanarPoint,
  c: IAutoMoviePlanarPoint,
  d: IAutoMoviePlanarPoint,
): boolean => {
  const first = side(c, d, a);
  const second = side(c, d, b);
  const third = side(a, b, c);
  const fourth = side(a, b, d);
  return (
    first !== 0 &&
    second !== 0 &&
    third !== 0 &&
    fourth !== 0 &&
    first !== second &&
    third !== fourth
  );
};

/** Whether two segments share any point, endpoints and overlap included. */
const segmentsTouch = (
  a: IAutoMoviePlanarPoint,
  b: IAutoMoviePlanarPoint,
  c: IAutoMoviePlanarPoint,
  d: IAutoMoviePlanarPoint,
): boolean =>
  segmentsCross(a, b, c, d) ||
  pointOnSegment(a, c, d) ||
  pointOnSegment(b, c, d) ||
  pointOnSegment(c, a, b) ||
  pointOnSegment(d, a, b);

/** Which side of the directed line `from -> to` a point falls on. */
const side = (
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
  point: IAutoMoviePlanarPoint,
): number => {
  const cross =
    (to.x - from.x) * (point.y - from.y) - (to.y - from.y) * (point.x - from.x);
  const scale = Math.max(
    1,
    Math.abs(to.x - from.x) + Math.abs(to.y - from.y),
    Math.abs(point.x - from.x) + Math.abs(point.y - from.y),
  );
  if (Math.abs(cross) <= PLANAR_EPSILON * scale) return 0;
  return cross > 0 ? 1 : -1;
};

/** Whether a point lies on a segment, its endpoints included. */
const pointOnSegment = (
  point: IAutoMoviePlanarPoint,
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
): boolean =>
  side(from, to, point) === 0 &&
  point.x >= Math.min(from.x, to.x) - PLANAR_EPSILON &&
  point.x <= Math.max(from.x, to.x) + PLANAR_EPSILON &&
  point.y >= Math.min(from.y, to.y) - PLANAR_EPSILON &&
  point.y <= Math.max(from.y, to.y) + PLANAR_EPSILON;
