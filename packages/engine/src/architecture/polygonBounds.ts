import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * The axis-aligned bounds of a polygon in its own planar frame.
 *
 * Returns the componentwise minimum and maximum of the points, in the
 * polygon's own units, as fresh objects the caller owns. An empty polygon
 * yields `Infinity` for `min` and `-Infinity` for `max` rather than throwing,
 * so callers pass a non-empty outline, which validation guarantees for every
 * face and opening. A `NaN` coordinate is skipped by the comparisons, so it
 * never becomes a bound.
 *
 * @param polygon Points of the ring, in any order.
 * @returns The lower and upper corners of the bounding box.
 *
 * @evidence contracts/common.md#principled-implementation A componentwise minimum and maximum over the points is the definition of an axis-aligned bounding box; it needs no premise beyond finite coordinates, and the empty and `NaN` cases follow from the identity elements of min and max as documented.
 * @evidence contracts/common.md#clear-and-simple-design One bounds helper read by wall cutting, observation stations and opening extents, so every planar extent is taken the same way.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No polygon or caller is special-cased; the empty case returns the identities instead of a fabricated box.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the units, ownership of the result, the empty and `NaN` cases and why callers do not hit the empty one.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the n points, O(n) time and O(1) extra space, replacing four mapped copies spread into `Math.min` and `Math.max`, which allocated four arrays and pushed every coordinate onto the call stack.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure bounds query over one ring; wall cutting, observation stations and opening extents each ask once per outline, so nothing is coordinated across requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only the two returned corners, which the caller owns; nothing else outlives the call.
 */
export const polygonBounds = (
  polygon: readonly IAutoMoviePlanarPoint[],
): { min: IAutoMoviePlanarPoint; max: IAutoMoviePlanarPoint } => {
  const min: IAutoMoviePlanarPoint = { x: Infinity, y: Infinity };
  const max: IAutoMoviePlanarPoint = { x: -Infinity, y: -Infinity };
  for (const point of polygon) {
    if (point.x < min.x) min.x = point.x;
    if (point.y < min.y) min.y = point.y;
    if (point.x > max.x) max.x = point.x;
    if (point.y > max.y) max.y = point.y;
  }
  return { min, max };
};
