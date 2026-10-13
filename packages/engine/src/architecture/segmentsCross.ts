import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { planarSide } from "./planarSide";

/**
 * Whether segments `a-b` and `c-d` cross at a point interior to both.
 *
 * Each segment's endpoints must lie strictly on opposite sides of the other's
 * line by {@link planarSide}. Any endpoint on the other line within tolerance,
 * so a touch at an endpoint, a T-junction or a collinear overlap, is not a
 * crossing; {@link segmentsTouch} answers those.
 *
 * @param a First endpoint of the first segment, in the caller's planar frame.
 * @param b Second endpoint of the first segment.
 * @param c First endpoint of the second segment.
 * @param d Second endpoint of the second segment.
 * @returns True only for a proper crossing.
 *
 * @evidence contracts/common.md#principled-implementation The classic four-orientation proper-intersection test: two segments properly cross exactly when each straddles the other's supporting line, and requiring every orientation to be non-zero excludes touching and collinear contact by construction.
 * @evidence contracts/common.md#clear-and-simple-design One proper-crossing test for `polygonInside` and `segmentsTouch`, replacing the copies each polygon predicate carried.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No configuration is special-cased; contact cases are excluded by the orientation signs alone, not by caller-specific checks.
 * @evidence contracts/common.md#meaningful-documentation The documentation states what counts as a crossing, which contacts do not, where to ask about contact instead, and each parameter's role.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant time, four orientation tests, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate over four points; it coordinates no work across requests or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads four points and allocates nothing, so no state, handle or task outlives the call.
 */
export const segmentsCross = (
  a: IAutoMoviePlanarPoint,
  b: IAutoMoviePlanarPoint,
  c: IAutoMoviePlanarPoint,
  d: IAutoMoviePlanarPoint,
): boolean => {
  const first: number = planarSide(c, d, a);
  const second: number = planarSide(c, d, b);
  const third: number = planarSide(a, b, c);
  const fourth: number = planarSide(a, b, d);
  return (
    first !== 0 &&
    second !== 0 &&
    third !== 0 &&
    fourth !== 0 &&
    first !== second &&
    third !== fourth
  );
};
