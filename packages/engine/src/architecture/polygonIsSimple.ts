import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { segmentsTouch } from "./segmentsTouch";

/**
 * Whether no two non-adjacent edges of a closed ring touch.
 *
 * Building outlines require a simple boundary, rather than selecting a fill rule for self-crossings. Adjacent edges are skipped because their shared corner is expected; consequently this function does not detect adjacent backtracking or overlapping adjacent segments.
 *
 * Contact uses {@link segmentsTouch}'s scale-relative `PLANAR_EPSILON`; a vertex on a non-adjacent edge counts as touching. Point count, adjacent degeneracy and area are separate caller checks: even a two- or three-point ring returns true here if no non-adjacent pair exists.
 *
 * @param polygon Closed ring of corners, the last joined back to the first.
 * @returns True when no two non-adjacent edges share a point.
 *
 * @evidence contracts/common.md#principled-implementation Tests every non-adjacent pair with the shared tolerance-based closed-segment predicate, including closing-edge adjacency. This is the non-adjacent-contact portion of simplicity validation; adjacent overlap, non-degenerate edges and sufficient point count require separate checks.
 * @evidence contracts/common.md#clear-and-simple-design Delegates contact to the shared `segmentsTouch`, so building validation and support-surface validation refuse self-contact under the same tolerance as the containment and overlap predicates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No figure or caller is special-cased; the only skipped pairs are the adjacent ones whose shared corner is not a defect, and degenerate point counts are left to the callers that own them, as documented.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why simplicity matters, which pairs are skipped, the tolerance and its consequence for a vertex on an edge, and that point count is not judged.
 * @evidence contracts/performance.md#efficient-algorithms O(n²) time and O(1) space with an early return on contact. For n at least three there are n(n-3)/2 non-adjacent pairs; no input-size cap or measured advantage over a sweep algorithm is assumed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure simplicity test of one outline; building and support validation each ask once per outline and share nothing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the two edge indices of the pair scan and allocates nothing, so no state survives the scan.
 */
export const polygonIsSimple: (polygon: readonly IAutoMoviePlanarPoint [ ]) => boolean = (
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
