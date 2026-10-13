import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * Twice the signed area of a closed polygon, positive when counter-clockwise.
 *
 * The polygon is an implicitly closed ring (the last point connects to the
 * first) in its own planar frame, so the result is in squared polygon units.
 * Counter-clockwise means with x right and y up. The doubled value is returned
 * because every caller compares it against a tolerance or halves it once
 * itself. An empty polygon returns 0, and a self-crossing one returns the net
 * signed sum of its lobes.
 *
 * @param polygon Closed ring of corners, the last joined back to the first.
 * @returns The shoelace sum, twice the signed enclosed area.
 *
 * @evidence contracts/common.md#principled-implementation The shoelace formula, the sum of the cross products of consecutive corners, which equals twice the signed area of any simple ring and the winding-weighted sum for a self-crossing one, as documented.
 * @evidence contracts/common.md#clear-and-simple-design One signed-area helper read by building validation, opening area and boundary-shell triangulation, so orientation and degeneracy are judged by one sum.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No ring or caller is special-cased; the empty ring yields the empty sum and degenerate rings report their true near-zero value for the caller's tolerance.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the closure convention, units, orientation sign and axis convention, why the value is doubled, and the empty and self-crossing cases.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the n corners, O(n) time and O(1) space, which is the minimum for a sum over every edge.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure sum over one ring; validation, opening area and shell triangulation each compute it once per outline they hold.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps a running sum and a loop index and allocates nothing, so nothing outlives the call.
 */
export const polygonDoubleArea = (
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
