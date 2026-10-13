import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * Twice the signed area of the triangle `origin -> from -> to`, in square
 * metres: positive for a counter-clockwise turn, negative for clockwise, and
 * zero for collinear points.
 *
 * It is the free-form region kernel's raw orientation measure; callers compare
 * it against the absolute `PLANAR_EPSILON`. The architecture graph's
 * `planarSide` asks the same question with a tolerance that grows with the
 * figure, which is why the two are not merged.
 *
 * @param origin Shared corner of both edges.
 * @param from End of the first edge.
 * @param to End of the second edge.
 * @returns `(from - origin) x (to - origin)`.
 *
 * @evidence contracts/common.md#principled-implementation The 2D cross product of the two edge vectors from a shared corner, the standard orientation determinant, evaluated in plain binary64 with no tolerance so each caller applies its own documented threshold.
 * @evidence contracts/common.md#clear-and-simple-design One formula shared by region validation, segment contact and ear clipping, which previously each carried a private copy, so all three classify a turn identically.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No caller-specific rounding or snapping; near-zero values are returned as computed and judged by the caller against its constant.
 * @evidence contracts/common.md#meaningful-documentation States the unit, the sign convention, the absence of a tolerance, and why it stays separate from the scale-relative `planarSide`.
 * @evidence contracts/performance.md#efficient-algorithms Constant time with two products and five subtractions and no allocation, the minimum for a 2D orientation determinant.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A constant-time pure expression; caching it would cost more than recomputing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads three points and returns a number, holding nothing.
 */
export const planarCross = (
  origin: IAutoMoviePlanarPoint,
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
): number =>
  (from.x - origin.x) * (to.y - origin.y) -
  (from.y - origin.y) * (to.x - origin.x);
