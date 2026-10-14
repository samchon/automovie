import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { pointInPolygon } from "./pointInPolygon";
import { segmentsTouch } from "./segmentsTouch";

/**
 * Whether two polygons share any point at all, contact included.
 *
 * Contact counts so opening validation can refuse voids meeting along a jamb.
 *
 * Requires non-empty simple rings in one planar frame and inherits the binary64 and scale-relative `PLANAR_EPSILON` behavior of {@link segmentsTouch} and {@link pointInPolygon}. An edge contact or containment of one corner returns true. Paired with a non-empty ring, an empty ring can throw a `TypeError` when its missing corner reaches the containment predicate.
 *
 * @param left One closed ring.
 * @param right The other closed ring, in the same frame.
 * @returns True when the closed regions share any point.
 *
 * @evidence contracts/common.md#principled-implementation Two simple polygons intersect exactly when their boundaries meet or one contains the other, and with disjoint boundaries containment of one corner implies containment of the whole ring, so one corner test per side completes the answer.
 * @evidence contracts/common.md#clear-and-simple-design Composes the shared `segmentsTouch` and `pointInPolygon` predicates, so opening overlap and support-surface overlap use the same contact rule as containment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No void, jamb or caller is special-cased; contact counts as overlap by the stated design reason, through the predicate's own tolerance.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why contact counts, the simple non-empty premise and the `TypeError` an empty ring raises, the two ways the answer becomes true, and each parameter's role.
 * @evidence contracts/performance.md#efficient-algorithms O(nm + n + m) time and O(1) space, returning on the first edge contact. This pairwise implementation has no input-size cap and does not assume all authored rings are small.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure overlap answer for one pair of rings; opening and support validation ask once per pair on one boundary.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the edge-pair counters and allocates nothing, so no object outlives the overlap test.
 */
export const polygonsOverlap: (
  left: readonly IAutoMoviePlanarPoint[],
  right: readonly IAutoMoviePlanarPoint[],
) => boolean = (
  left: readonly IAutoMoviePlanarPoint[],
  right: readonly IAutoMoviePlanarPoint[],
): boolean => {
  for (let index: number = 0; index < left.length; ++index)
    for (let other: number = 0; other < right.length; ++other)
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
