import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { pointOnSegment } from "./pointOnSegment";
import { segmentsCross } from "./segmentsCross";

/**
 * Whether segments `a-b` and `c-d` share any point, endpoints and collinear
 * overlap included.
 *
 * True for a proper crossing by {@link segmentsCross}, or when any endpoint of
 * one segment lies on the other by {@link pointOnSegment}. Those cases are
 * exhaustive: two closed segments that meet without properly crossing must
 * meet at an endpoint of one of them.
 *
 * @param a First endpoint of the first segment, in the caller's planar frame.
 * @param b Second endpoint of the first segment.
 * @param c First endpoint of the second segment.
 * @param d Second endpoint of the second segment.
 * @returns True when the closed segments share a point within tolerance.
 *
 * @evidence contracts/common.md#principled-implementation Uses the standard decomposition of closed-segment intersection into a proper crossing or an endpoint lying on the other segment, which is complete because a non-crossing contact, including collinear overlap, always contains an endpoint.
 * @evidence contracts/common.md#clear-and-simple-design The contact test `polygonIsSimple` and `polygonsOverlap` both need, composed from the shared crossing and point-on-segment predicates instead of the private copy each file kept.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No configuration or caller is special-cased; every contact is decided by the two shared predicates and their shared tolerance.
 * @evidence contracts/common.md#meaningful-documentation The documentation states what counts as touching, why the case split is complete, and each parameter's role.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant time, at most four orientation tests and four point-on-segment tests, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure contact predicate over two segments, called per edge pair by the polygon predicates; it shares no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads two segments, delegates to allocation-free predicates, and retains nothing.
 */
export const segmentsTouch = (
  a: IAutoMoviePlanarPoint,
  b: IAutoMoviePlanarPoint,
  c: IAutoMoviePlanarPoint,
  d: IAutoMoviePlanarPoint,
): boolean =>
  segmentsCross(a, b, c, d) ||
  pointOnSegment(a, c, d) ||
  pointOnSegment(b, c, d) ||
  pointOnSegment(c, a, b) ||
  pointOnSegment(d, a, b);
