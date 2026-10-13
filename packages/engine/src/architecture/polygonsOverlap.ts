import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { PLANAR_EPSILON } from "../geometry/constants/PLANAR_EPSILON";
import { pointInPolygon } from "./pointInPolygon";

/**
 * Whether two polygons share any point at all, contact included.
 *
 * Contact counts because two voids meeting exactly along a jamb are one void
 * written twice, and the wall between them has nothing left to be.
 *
 * Both polygons are non-empty simple closed rings in one planar frame. True
 * when any edge of one touches any edge of the other within the scale-relative
 * `PLANAR_EPSILON` tolerance, or when one lies wholly inside the other.
 *
 * @evidence contracts/common.md#principled-implementation Tests every edge pair for contact, and when none touches, tests one vertex of each ring against the other with `pointInPolygon`; for simple rings with no boundary contact, either one encloses the other entirely or they are disjoint, so one vertex decides.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the shared `pointInPolygon` but carries its own copies of `side`, `segmentsCross`, `segmentsTouch` and `pointOnSegment`, identical to those in `polygonIsSimple`, instead of importing one implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counting contact as overlap is the stated contract for voids on one boundary; no polygon is special-cased, and an empty ring would make the `[0]!` vertex access read `undefined`, which validated callers never pass.
 * @evidence contracts/common.md#meaningful-documentation States why contact counts, the simple and non-empty premise, the shared frame, the tolerance, and the enclosure case.
 * @evidence contracts/performance.md#cost-and-resources O(n·m) segment tests for n and m vertices with an early exit, then two O(n + m) containment tests only when no edges touch; nothing is allocated, cached or retained.
 */
export const polygonsOverlap = (
  left: readonly IAutoMoviePlanarPoint[],
  right: readonly IAutoMoviePlanarPoint[],
): boolean => {
  for (let index = 0; index < left.length; ++index)
    for (let other = 0; other < right.length; ++other)
      if (
        segmentsTouch(
          left[index]!,
          left[(index + 1) % left.length]!,
          right[other]!,
          right[(other + 1) % right.length]!,
        )
      )
        return true;
  return (
    pointInPolygon(left[0]!, right) === true ||
    pointInPolygon(right[0]!, left) === true
  );
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
