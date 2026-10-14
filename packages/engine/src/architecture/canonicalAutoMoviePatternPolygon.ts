import { IAutoMovieVector3 } from "@automovie/interface";

import { convexHull2D } from "../math/convexHull2D";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * Canonicalize an authored face-local polygon to a counter-clockwise convex
 * outline, or throw.
 *
 * Treats the input as an unordered point set and compares hull/input counts. Interior, duplicate and collinear points dropped by the hull cause refusal. Authored boundary order is discarded: even a self-crossing ordering of convex-position points can be accepted and reordered.
 *
 * Throws an `Error` prefixed with `label` for a non-finite corner, for fewer
 * than three non-collinear corners, and for any corner the hull drops.
 *
 * @param polygon Authored corners, in face-local metres and any winding.
 * @param label Field name the refusals start with.
 * @returns The same corners as a counter-clockwise convex outline.
 *
 * @evidence contracts/common.md#principled-implementation Delegates point-set hull construction to `convexHull2D`, requires at least three retained points and unchanged count, and returns its counter-clockwise order. This checks retained convex-position points under the hull's numerical predicate, not the simplicity or convexity of the original authored ring order.
 * @evidence contracts/common.md#clear-and-simple-design One canonicalizer for every zone region and exclusion of the pattern run, reusing `convexHull2D` on the ground plane rather than a second hull implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not silently drop authored points; count loss refuses. Reordering is intentional and explicit because the contract is a convex point set rather than preservation of an authored ring.
 * @evidence contracts/common.md#meaningful-documentation States what is refused and why, the returned winding, the units, and every thrown case with its label.
 * @evidence contracts/performance.md#efficient-algorithms O(N log N) hull work plus O(N) finiteness checks and coordinate copies, with no assumption that authored outlines have a fixed small size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one outline; the pattern run calls it once per region and exclusion and reuses the result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates the lifted and hulled copies for one call and retains nothing; the caller owns the returned outline.
 */
export const canonicalAutoMoviePatternPolygon: (
  polygon: readonly IAutoMoviePatternPoint[],
  label: string,
) => IAutoMoviePatternPoint[] = (
  polygon: readonly IAutoMoviePatternPoint[],
  label: string,
): IAutoMoviePatternPoint[] => {
  polygon.forEach((point: IAutoMoviePatternPoint, index: number): void => {
    if (!Number.isFinite(point.u) || !Number.isFinite(point.v))
      throw new Error(`${label}[${index}] must be finite`);
  });
  const hull: IAutoMoviePatternPoint[] = convexHull2D(
    polygon.map(
      (point: IAutoMoviePatternPoint): IAutoMovieVector3 => ({
        x: point.u,
        y: 0,
        z: point.v,
      }),
    ),
  ).map(
    (point: IAutoMovieVector3): IAutoMoviePatternPoint => ({
      u: point.x,
      v: point.z,
    }),
  );
  if (hull.length < 3)
    throw new Error(`${label} needs at least three non-collinear points`);
  if (hull.length !== polygon.length)
    throw new Error(`${label} must be convex and contain no interior points`);
  return hull;
};
