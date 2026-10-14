import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { AUTOMOVIE_OBSERVATION_EPSILON } from "./constants/AUTOMOVIE_OBSERVATION_EPSILON";

/**
 * The area-weighted centroid of a closed planar outline, or the mean of its
 * points when the outline encloses no area.
 *
 * The outline is read as a simple polygon closing from its last point back to its first, in either winding. When the absolute doubled signed area is at most `AUTOMOVIE_OBSERVATION_EPSILON`, including a sufficiently small nonzero area, the vertex mean is returned instead. An empty outline answers `NaN` coordinates.
 *
 * @evidence contracts/common.md#principled-implementation Evaluates the shoelace centroid formula in binary64, with vertex-mean fallback below the doubled-area threshold. The ideal formula is winding independent for simple polygons; finite inputs alone do not prevent intermediate overflow/cancellation, and this helper does not certify containment of the resulting point.
 * @evidence contracts/common.md#clear-and-simple-design One planar helper beside `outlineHull` and `polygonBounds`, so the envelope query reads a face centroid without carrying a private copy of the formula.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no face or caller; the degenerate threshold is the shared observation tolerance, applied to every outline alike.
 * @evidence contracts/common.md#meaningful-documentation States the closing rule, that winding does not matter, the degenerate threshold and its fallback, and the `NaN` answer for an empty outline.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the outline's points, plus a second pass only in the degenerate fallback, with constant extra space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one outline that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the one returned point.
 */
export const outlineCentroid: (outline: readonly IAutoMoviePlanarPoint[]) => IAutoMoviePlanarPoint = (
  outline: readonly IAutoMoviePlanarPoint[],
): IAutoMoviePlanarPoint => {
  let doubleArea: number = 0;
  let x: number = 0;
  let y: number = 0;
  for (let index: number = 0; index < outline.length; index++) {
    const from: IAutoMoviePlanarPoint = outline[index]!;
    const to: IAutoMoviePlanarPoint = outline[(index + 1) % outline.length]!;
    const cross: number = from.x * to.y - to.x * from.y;
    doubleArea += cross;
    x += (from.x + to.x) * cross;
    y += (from.y + to.y) * cross;
  }
  if (Math.abs(doubleArea) > AUTOMOVIE_OBSERVATION_EPSILON)
    return { x: x / (3 * doubleArea), y: y / (3 * doubleArea) };
  let sumX: number = 0;
  let sumY: number = 0;
  for (const point of outline) {
    sumX += point.x;
    sumY += point.y;
  }
  return { x: sumX / outline.length, y: sumY / outline.length };
};
