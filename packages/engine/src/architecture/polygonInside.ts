import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { pointInPolygon } from "./pointInPolygon";
import { segmentsCross } from "./segmentsCross";

/**
 * Whether an inner polygon stays within an outer one, flush edges allowed.
 *
 * Only a crossing counts against containment, so a void whose sill lies exactly
 * on the wall's own bottom edge is contained, while a void whose corner pokes
 * through the wall's side is not. Every inner corner must be inside or on the
 * outer ring by {@link pointInPolygon}, and no inner edge may properly cross an
 * outer edge by {@link segmentsCross}.
 *
 * Both polygons are closed rings in one planar frame and are assumed simple.
 * For a convex `outer` the answer is exact. For a concave `outer` an inner
 * edge that leaves only through outer vertices, such as an edge laid flush
 * across a notch whose two corners it touches, is not detected, because a
 * crossing must be interior to both segments.
 *
 * @param inner Ring that must stay inside, such as an opening's void hull.
 * @param outer Ring that must contain it, such as the host face outline.
 * @returns True when `inner` stays within `outer` by the rule above.
 *
 * @evidence contracts/common.md#principled-implementation Containment of one simple polygon in another holds when every vertex of the inner is in the outer and no pair of edges properly crosses; contact is allowed by using the boundary-inclusive point test and the proper-crossing test, and the notch case that only touches outer vertices is the documented gap of this edge-pair method.
 * @evidence contracts/common.md#clear-and-simple-design Composes the shared `pointInPolygon` and `segmentsCross` predicates, so opening-in-face, panel fit, service and support-surface containment all apply one rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no void, wall or caller; flush edges pass because contact is not a crossing, not through any special case, and the concave-notch gap is stated rather than masked.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the containment rule, which contact is allowed, the premise of simple rings, exactness for convex outers, the concave-notch limitation, and each parameter's role.
 * @evidence contracts/performance.md#efficient-algorithms O(n·m) time and O(1) space for n inner and m outer corners: n point tests of O(m) each and n·m edge-pair tests, with an early return on the first failure; authored voids and faces carry tens of corners, so no sweep-line structure is built.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure containment answer for one pair of rings; each validator asks once per void and face pair.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds two loop counters over the inner and outer rings and allocates nothing, so nothing outlives the call.
 */
export const polygonInside = (
  inner: readonly IAutoMoviePlanarPoint[],
  outer: readonly IAutoMoviePlanarPoint[],
): boolean => {
  if (
    inner.some(
      (point: IAutoMoviePlanarPoint): boolean =>
        pointInPolygon(point, outer) === false,
    )
  )
    return false;
  for (let index: number = 0; index < inner.length; ++index)
    for (let other: number = 0; other < outer.length; ++other)
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
