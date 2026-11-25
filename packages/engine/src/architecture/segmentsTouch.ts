import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { pointOnSegment } from "./pointOnSegment";
import { segmentsCross } from "./segmentsCross";

/**
 * Whether segments `a-b` and `c-d` share any point, endpoints and collinear
 * overlap included.
 *
 * True for a proper crossing by {@link segmentsCross}, or when any endpoint of
 * one segment lies on the other by {@link pointOnSegment}. Those cases are
 * exhaustive: two closed segments that meet without properly crossing must meet
 * at an endpoint of one of them.
 *
 * @param a First endpoint of the first segment, in the caller's planar frame.
 * @param b Second endpoint of the first segment.
 * @param c First endpoint of the second segment.
 * @param d Second endpoint of the second segment.
 * @returns True when the closed segments share a point within tolerance.
 */
export const segmentsTouch: (
  a: IAutoMoviePlanarPoint,
  b: IAutoMoviePlanarPoint,
  c: IAutoMoviePlanarPoint,
  d: IAutoMoviePlanarPoint,
) => boolean = (
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
