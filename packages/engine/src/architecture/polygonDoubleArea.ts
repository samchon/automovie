import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * Twice the signed area of a closed polygon, positive when counter-clockwise.
 *
 * The polygon is an implicitly closed ring (the last point connects to the
 * first) in its own planar frame, so the result is in squared polygon units.
 * Counter-clockwise means with x right and y up. An empty polygon returns 0,
 * and a self-crossing one returns the net signed sum of its lobes.
 *
 * @evidence contracts/common.md#principled-implementation The shoelace formula, summing `x_i y_{i+1} - x_{i+1} y_i` over the closed ring; it is exact for any simple polygon and keeps the doubled value to avoid one division.
 * @evidence contracts/common.md#clear-and-simple-design Returns the doubled signed value so one helper serves both the zero-area refusal in validation and the orientation and area uses in opening area and shell triangulation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Applies no epsilon or absolute value itself; each caller chooses its own threshold and sign handling, and no polygon is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the doubling, the sign convention and its axes, the implicit closure, the units, and the results for empty and self-crossing input.
 * @evidence contracts/performance.md#cost-and-resources One O(n) pass over the ring with a running sum, and no allocation, cache or retained state.
 */
export const polygonDoubleArea = (
  polygon: readonly IAutoMoviePlanarPoint[],
): number => {
  let sum = 0;
  polygon.forEach((point, index) => {
    const next = polygon[(index + 1) % polygon.length]!;
    sum += point.x * next.y - next.x * point.y;
  });
  return sum;
};
