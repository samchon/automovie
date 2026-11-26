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
 */
export function segmentsCross(
  a: IAutoMoviePlanarPoint,
  b: IAutoMoviePlanarPoint,
  c: IAutoMoviePlanarPoint,
  d: IAutoMoviePlanarPoint,
): boolean {
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
}
