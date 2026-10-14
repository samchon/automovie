import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * Twice the signed area of a closed polygon, positive when counter-clockwise.
 *
 * The ring closes from last to first in its planar frame; units are squared polygon units and counter-clockwise uses x right, y up. Empty input returns zero. In exact arithmetic the shoelace sum is twice signed area, or a winding-weighted sum for self-crossings; this binary64 accumulation can cancel or overflow, especially for small regions at large offsets.
 *
 * @param polygon Closed ring of corners, the last joined back to the first.
 * @returns The shoelace sum, twice the signed enclosed area.
 *
 * @evidence contracts/common.md#principled-implementation The shoelace formula, the sum of the cross products of consecutive corners, which equals twice the signed area of any simple ring and the winding-weighted sum for a self-crossing one, as documented.
 * @evidence contracts/common.md#clear-and-simple-design One signed-area helper read by building validation, opening area and boundary-shell triangulation, so orientation and degeneracy are judged by one sum.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No ring or caller is special-cased; the empty ring yields the empty sum, and degeneracy decisions use the caller's tolerance on the computed sum rather than an exact-area claim.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the closure convention, units, orientation sign and axis convention, why the value is doubled, and the empty and self-crossing cases.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the n corners, O(n) time and O(1) space, which is the minimum for a sum over every edge.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure sum over one ring; validation, opening area and shell triangulation each compute it once per outline they hold.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps a running sum and a loop index and allocates nothing, so nothing outlives the call.
 */
export const polygonDoubleArea: (polygon: readonly IAutoMoviePlanarPoint [ ]) => number = (
  polygon: readonly IAutoMoviePlanarPoint[],
): number => {
  let sum: number = 0;
  for (let index: number = 0; index < polygon.length; ++index) {
    const point: IAutoMoviePlanarPoint = polygon[index]!;
    const next: IAutoMoviePlanarPoint = polygon[(index + 1) % polygon.length]!;
    sum += point.x * next.y - next.x * point.y;
  }
  return sum;
};
