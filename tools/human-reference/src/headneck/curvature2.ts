import type { V2 } from "../geometry/V2.ts";

/**
 * Estimates signed planar curvature from three source points around a physical
 * arclength window. Units are inverse millimetres. Missing or degenerate
 * neighborhoods return zero as an unavailable estimate, not proof of flatness.
 *
 * @evidence contracts/common.md#principled-implementation Twice the oriented triangle cross product divided by its three side lengths gives signed circumcircle curvature.
 * @evidence contracts/common.md#clear-and-simple-design Physical neighbor walks and one circumcircle calculation own this local estimate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The neighbor window uses source distance rather than tessellation index count.
 * @evidence contracts/common.md#meaningful-documentation States inverse-mm units, physical window and the interpretation of degenerate zero estimates.
 * @evidence contracts/performance.md#efficient-algorithms Two bounded neighbor walks take at most linear time in the source curve and constant temporary space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This local estimate coordinates no reusable request state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources It retains no arrays, handles or running tasks after return.
 */
export function curvature2(
  points: V2[],
  index: number,
  windowMm: number,
): number {
  if (
    index < 0 ||
    index >= points.length ||
    !Number.isFinite(windowMm) ||
    windowMm <= 0
  )
    throw new Error(
      "A valid point index and positive physical curvature window are required",
    );
  let first: number = index,
    before: number = 0,
    last: number = index,
    after: number = 0;
  while (first > 0 && before < windowMm) {
    before += Math.hypot(
      points[first][0] - points[first - 1][0],
      points[first][1] - points[first - 1][1],
    );
    first--;
  }
  while (last < points.length - 1 && after < windowMm) {
    after += Math.hypot(
      points[last + 1][0] - points[last][0],
      points[last + 1][1] - points[last][1],
    );
    last++;
  }
  if (first === index || last === index) return 0;
  const a: V2 = points[first],
    b: V2 = points[index],
    c: V2 = points[last];
  const cross: number =
    (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
  const product: number =
    Math.hypot(b[0] - a[0], b[1] - a[1]) *
    Math.hypot(c[0] - b[0], c[1] - b[1]) *
    Math.hypot(c[0] - a[0], c[1] - a[1]);
  return product > 0 ? (2 * cross) / product : 0;
}
