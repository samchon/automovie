import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { segmentsTouch } from "./segmentsTouch";

/**
 * Whether no two non-adjacent edges of a closed ring touch.
 *
 * Building outlines require a simple boundary, rather than selecting a fill
 * rule for self-crossings. Adjacent edges are skipped because their shared
 * corner is expected; consequently this function does not detect adjacent
 * backtracking or overlapping adjacent segments.
 *
 * Contact uses {@link segmentsTouch}'s scale-relative `PLANAR_EPSILON`; a vertex
 * on a non-adjacent edge counts as touching. Point count, adjacent degeneracy
 * and area are separate caller checks: even a two- or three-point ring returns
 * true here if no non-adjacent pair exists.
 *
 * @param polygon Closed ring of corners, the last joined back to the first.
 * @returns True when no two non-adjacent edges share a point.
 */
export const polygonIsSimple: (
  polygon: readonly IAutoMoviePlanarPoint[],
) => boolean = (polygon: readonly IAutoMoviePlanarPoint[]): boolean => {
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
