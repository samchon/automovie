import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { PLANAR_EPSILON } from "../geometry/constants/PLANAR_EPSILON";

/**
 * Which side of the directed line `from -> to` a point falls on: `1` left,
 * `-1` right, `0` on the line.
 *
 * The sign is the 2D cross product `(to - from) x (point - from)` with x right
 * and y up. It counts as zero when its magnitude is at most `PLANAR_EPSILON`
 * (1e-12) times the larger of 1 and the Manhattan lengths of `to - from` and
 * `point - from`, so the tolerance grows with the size of the figure and never
 * falls below the absolute floor. A degenerate line, `from` equal to `to`,
 * puts every point on it.
 *
 * @param from Start of the directed line, in the caller's planar frame.
 * @param to End of the directed line, in the same frame.
 * @param point Point to classify, in the same frame.
 * @returns `1`, `-1` or `0` as described above.
 *
 * @evidence contracts/common.md#principled-implementation Classifies the binary64 cross-product sign outside an extent-scaled zero band. The linear band is a tolerance policy, not a proven roundoff bound or adaptive exact orientation predicate. Callers need finite, suitable-scale intermediates; overflow/cancellation can invalidate the geometric interpretation.
 * @evidence contracts/common.md#clear-and-simple-design The one orientation test behind `pointOnSegment`, `segmentsCross`, `segmentsTouch` and so every planar containment and overlap predicate, replacing four private copies those predicates each carried.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate, figure or caller is special-cased; the tolerance is the shared `PLANAR_EPSILON` constant scaled by the operands themselves.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the sign convention and axis orientation, the exact zero band and its floor, the degenerate-line answer, and each parameter's frame.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant time, one cross product and one comparison, with no algorithm or structure to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate over three points; it coordinates no work across requests or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads three points and allocates nothing, so no state, handle or task outlives the call.
 */
export const planarSide: (
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
  point: IAutoMoviePlanarPoint,
) => -1 | 0 | 1 = (
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
  point: IAutoMoviePlanarPoint,
): -1 | 0 | 1 => {
  const cross: number =
    (to.x - from.x) * (point.y - from.y) - (to.y - from.y) * (point.x - from.x);
  const scale: number = Math.max(
    1,
    Math.abs(to.x - from.x) + Math.abs(to.y - from.y),
    Math.abs(point.x - from.x) + Math.abs(point.y - from.y),
  );
  if (Math.abs(cross) <= PLANAR_EPSILON * scale) return 0;
  return cross > 0 ? 1 : -1;
};
