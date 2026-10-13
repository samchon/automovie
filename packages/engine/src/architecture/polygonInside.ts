import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { PLANAR_EPSILON } from "../geometry/constants/PLANAR_EPSILON";
import { pointInPolygon } from "./pointInPolygon";

/**
 * Whether an inner polygon stays within an outer one, flush edges allowed.
 *
 * Only a crossing counts against containment, so a void whose sill lies exactly
 * on the wall's own bottom edge is contained, while a void whose corner pokes
 * through the wall's side is not.
 *
 * Both polygons are closed rings in one planar frame and are assumed simple.
 * For a convex `outer` the answer is exact. For a concave `outer` an inner
 * edge that leaves only through outer vertices, such as an edge laid flush
 * across a notch whose two corners it touches, is not detected, because a
 * crossing must be interior to both segments.
 *
 * @evidence contracts/common.md#principled-implementation Requires every inner vertex to pass the boundary-inclusive `pointInPolygon` test and no inner edge to properly cross an outer edge; that is complete for convex outers, but an inner edge passing out of a concave outer only through outer vertices satisfies both tests, an unresolved degeneracy.
 * @evidence contracts/common.md#clear-and-simple-design Composes the shared `pointInPolygon` with a private crossing test, but its `side` helper and the `segmentsCross` logic are verbatim copies of code in `polygonIsSimple` and `polygonsOverlap` rather than one shared module.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counting only proper crossings is the contract that lets flush edges pass, and nothing is special-cased; the missed vertex-only exit is stated as a limitation rather than compensated for.
 * @evidence contracts/common.md#meaningful-documentation States the flush-edge rule, the shared frame and simplicity premise, exactness for convex outers, and the concave vertex-touching case it misses.
 * @evidence contracts/performance.md#cost-and-resources O(n·m) for n inner and m outer points, n containment tests of O(m) and n·m segment tests, returning at the first failure; it allocates nothing and caches nothing between the per-opening and per-panel calls validation makes.
 */
export const polygonInside = (
  inner: readonly IAutoMoviePlanarPoint[],
  outer: readonly IAutoMoviePlanarPoint[],
): boolean => {
  if (inner.some((point) => pointInPolygon(point, outer) === false))
    return false;
  for (let index = 0; index < inner.length; ++index)
    for (let other = 0; other < outer.length; ++other)
      if (
        segmentsCross(
          inner[index]!,
          inner[(index + 1) % inner.length]!,
          outer[other]!,
          outer[(other + 1) % outer.length]!,
        )
      )
        return false;
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
