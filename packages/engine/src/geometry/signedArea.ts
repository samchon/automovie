import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/**
 * Signed area enclosed by a closed planar ring, positive when the ring runs
 * counter-clockwise in its `x, y` plane.
 *
 * The last point joins back to the first. Coordinates are metres, so the
 * result is square metres; a self-crossing ring returns the net of its
 * oppositely wound lobes, and fewer than three points return zero.
 *
 * @param points Ring corners in order.
 * @returns Signed area in square metres.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The shoelace formula, half the sum of consecutive cross products, is the exact signed area of any simple polygon by Green's theorem; callers decide orientation and degeneracy from its sign and magnitude, and every region they keep has passed `autoMoviePlanarRegionFailure`, which refuses self-crossing rings, so the net-lobe value only decides which diagnostic a crossing ring receives, for example a loft winding mismatch before the crossing itself is reported.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One kernel helper shared by region validation, canonical winding and loft section matching, so all three read orientation the same way.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance or absolute value is applied here; each caller states its own zero test against the raw signed value.
 * @evidence contracts/development/common.md#meaningful-documentation States the sign convention, ring closure, unit, and the self-crossing and short-ring results.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the N ring points with constant work each and no allocation, which is the minimum for a sum that reads every point.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure scalar of the ring passed in; callers compute it once per ring they decide on.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Reads the ring in place, allocating no array or object and retaining nothing after it returns.
 */
export const signedArea: (
  points: readonly IAutoMovieProfilePoint[],
) => number = (points: readonly IAutoMovieProfilePoint[]): number => {
  let total: number = 0;
  for (let index: number = 0; index < points.length; ++index) {
    const from: IAutoMovieProfilePoint = points[index]!;
    const to: IAutoMovieProfilePoint = points[(index + 1) % points.length]!;
    total += from.x * to.y - to.x * from.y;
  }
  return total / 2;
};
