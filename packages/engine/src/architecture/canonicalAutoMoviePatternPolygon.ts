import {
  type IAutoMoviePatternPoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { convexHull2D } from "../math/convexHull2D";

/**
 * Canonicalize an authored face-local polygon to a counter-clockwise convex
 * outline, or throw.
 *
 * Treats the input as an unordered point set and compares hull/input counts.
 * Interior, duplicate and collinear points dropped by the hull cause refusal.
 * Authored boundary order is discarded: even a self-crossing ordering of
 * convex-position points can be accepted and reordered.
 *
 * Throws an `Error` prefixed with `label` for a non-finite corner, for fewer
 * than three non-collinear corners, and for any corner the hull drops.
 *
 * @param polygon Authored corners, in face-local metres and any winding.
 * @param label Field name the refusals start with.
 * @returns The same corners as a counter-clockwise convex outline.
 */
export const canonicalAutoMoviePatternPolygon: (
  polygon: readonly IAutoMoviePatternPoint[],
  label: string,
) => IAutoMoviePatternPoint[] = (
  polygon: readonly IAutoMoviePatternPoint[],
  label: string,
): IAutoMoviePatternPoint[] => {
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
