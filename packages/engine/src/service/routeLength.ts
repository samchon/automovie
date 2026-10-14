import { IAutoMovieServiceSegment, IAutoMovieVector3 } from "@automovie/interface";
/**
 * Sum consecutive 3D centre-line lengths in metres; fewer than two points yield zero.
 * Finite represented differences and total are the caller's premise.
 *
 * @evidence contracts/common.md#principled-implementation Math.hypot measures each three-dimensional leg and a declared-order sum yields developed polyline length rather than projected schematic length.
 * @evidence contracts/common.md#clear-and-simple-design Schematic totals use this scalar owner while route coordinates remain on the authored segment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No bend fitting allowance or hydraulic equivalent length is invented; degenerate or absent legs contribute their measured zero.
 * @evidence contracts/common.md#meaningful-documentation States metres, full three-dimensional route, empty/singleton zero and finite-arithmetic premise.
 * @evidence contracts/performance.md#efficient-algorithms R route points require R-minus-one fixed-size norms, O(R) time and constant scalar storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each schematic edge is measured once in its report; no route-mutation-sensitive length cache is kept here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A primitive accumulated length escapes without copying the route or retaining endpoint records.
 */
export const routeLength: (segment: IAutoMovieServiceSegment) => number = (segment: IAutoMovieServiceSegment): number => {
  let total: number = 0;
  for (let index: number = 0; index + 1 < segment.route.length; ++index) {
    const one: IAutoMovieVector3 = segment.route[index]!;
    const next: IAutoMovieVector3 = segment.route[index + 1]!;
    total += Math.hypot(next.x - one.x, next.y - one.y, next.z - one.z);
  }
  return total;
};
