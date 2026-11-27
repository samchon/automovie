import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { pointOnSegment } from "./pointOnSegment";
import { segmentsCross } from "./segmentsCross";

/*
 * Whether segments `a-b` and `c-d` share any point, endpoints and collinear
 * overlap included.
 *
 * True for a proper crossing by segmentsCross, or when any endpoint of
 * one segment lies on the other by pointOnSegment. Those cases are
 * exhaustive: two closed segments that meet without properly crossing must meet
 * at an endpoint of one of them.
 * Parameter a: First endpoint of the first segment, in the caller's planar frame.
 * Parameter b: Second endpoint of the first segment.
 * Parameter c: First endpoint of the second segment.
 * Parameter d: Second endpoint of the second segment.
 * Returns: True when the closed segments share a point within tolerance.
 */
export function segmentsTouch(
  a: IAutoMoviePlanarPoint,
  b: IAutoMoviePlanarPoint,
  c: IAutoMoviePlanarPoint,
  d: IAutoMoviePlanarPoint,
): boolean {
  return (
    segmentsCross(a, b, c, d) ||
    pointOnSegment(a, c, d) ||
    pointOnSegment(b, c, d) ||
    pointOnSegment(c, a, b) ||
    pointOnSegment(d, a, b)
  );
}
