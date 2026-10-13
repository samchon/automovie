import { IAutoMovieVector3 } from "@automovie/interface";

import { convexHull2D } from "../math/convexHull2D";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * Canonicalize an authored face-local polygon to a counter-clockwise convex
 * outline, or throw.
 *
 * The hull is taken and then compared with the input, so a reflex corner, an
 * interior point, a repeated point, and a point sitting on an edge are all
 * refused instead of being silently absorbed. That is the same refusal the
 * procedural profile kernel makes, for the same reason: a clipper fed a
 * non-convex outline reports areas the surface does not have.
 *
 * Throws an `Error` prefixed with `label` for a non-finite corner, for fewer
 * than three non-collinear corners, and for any corner the hull drops.
 *
 * @param polygon Authored corners, in face-local metres and any winding.
 * @param label Field name the refusals start with.
 * @returns The same corners as a counter-clockwise convex outline.
 *
 * @evidence contracts/common.md#principled-implementation The convex hull of a point set keeps every corner exactly when the set is already a strictly convex polygon, so comparing hull and input sizes decides convexity, and the hull's counter-clockwise order is the winding the clipper requires.
 * @evidence contracts/common.md#clear-and-simple-design One canonicalizer for every zone region and exclusion of the pattern run, reusing `convexHull2D` on the ground plane rather than a second hull implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Repairs nothing: a non-convex, repeated or collinear corner is refused rather than dropped, so the authored outline is the measured one.
 * @evidence contracts/common.md#meaningful-documentation States what is refused and why, the returned winding, the units, and every thrown case with its label.
 * @evidence contracts/performance.md#efficient-algorithms O(n log n) in the corner count for the hull, which dominates the linear finiteness check; authored outlines are a handful of corners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one outline; the pattern run calls it once per region and exclusion and reuses the result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates the lifted and hulled copies for one call and retains nothing; the caller owns the returned outline.
 */
export const canonicalAutoMoviePatternPolygon = (
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
