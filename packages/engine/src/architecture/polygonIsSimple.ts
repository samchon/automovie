import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { segmentsTouch } from "./segmentsTouch";

/**
 * Whether a closed polygon never crosses or touches itself away from a shared
 * corner.
 *
 * A self-crossing outline has no interior, so every later question about what
 * is inside it would answer arbitrarily. Adjacent edges are skipped because
 * they legitimately meet at the corner they share.
 *
 * Contact uses {@link segmentsTouch} and so the same scale-relative
 * `PLANAR_EPSILON` tolerance as the other planar predicates, which means a
 * vertex lying on a non-adjacent edge counts as touching. The point count is
 * not checked: a ring of two or three points is reported simple, and callers
 * test area or point count separately.
 *
 * @param polygon Closed ring of corners, the last joined back to the first.
 * @returns True when no two non-adjacent edges share a point.
 *
 * @evidence contracts/common.md#principled-implementation A ring is simple exactly when no two non-adjacent edges intersect, so the function tests every such pair with the shared closed-segment contact predicate; adjacency includes the closing pair of the first and last edge.
 * @evidence contracts/common.md#clear-and-simple-design Delegates contact to the shared `segmentsTouch`, so building validation and support-surface validation refuse self-contact under the same tolerance as the containment and overlap predicates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No figure or caller is special-cased; the only skipped pairs are the adjacent ones whose shared corner is not a defect, and degenerate point counts are left to the callers that own them, as documented.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why simplicity matters, which pairs are skipped, the tolerance and its consequence for a vertex on an edge, and that point count is not judged.
 * @evidence contracts/performance.md#efficient-algorithms O(n²) time and O(1) space over the n(n-3)/2 non-adjacent edge pairs with an early return on the first contact; a Shamos-Hoey sweep would be O(n log n), but faces and void hulls carry tens of corners, so the pairwise scan is kept and no sweep structure is built.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure simplicity test of one outline; building and support validation each ask once per outline and share nothing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the two edge indices of the pair scan and allocates nothing, so no state survives the scan.
 */
export const polygonIsSimple = (
  polygon: readonly IAutoMoviePlanarPoint[],
): boolean => {
  const count: number = polygon.length;
  for (let left: number = 0; left < count; ++left)
    for (let right: number = left + 1; right < count; ++right) {
      const adjacent: boolean =
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
