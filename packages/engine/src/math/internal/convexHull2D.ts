import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieEnginePlanarHull } from "../AutoMovieEnginePlanarHull";

/**
 * 2D convex hull and point queries over the horizontal XZ plane.
 *
 * Points are {@link IAutoMovieVector3}; only `x` and `z` are used (`y` ignored),
 * because support and balance are decided by the ground-plane footprint. The
 * hull is built with Andrew's monotone chain, deterministic (no `Math.random`)
 * so support/topple judgments are reproducible, and canonicalized to
 * counter-clockwise order, so callers never have to assume the input points
 * were given convex or correctly ordered.
 */
export function convexHull2D(
  points: readonly IAutoMovieVector3[],
): IAutoMovieVector3[] {
  const unique: IAutoMovieVector3[] = dedupeXZ(points);
  if (unique.length <= 2) return unique;

  const hull: IAutoMovieVector3[] = AutoMovieEnginePlanarHull.vertices(
    unique,
    "x",
    "z",
  );

  // All input points collinear → the chain collapses to the two extremes.
  return hull.length >= 3 ? hull : dedupeXZ(hull);
}

/** Retain the first original point at each projected floor coordinate. */
const dedupeXZ: (
  points: readonly IAutoMovieVector3[],
) => IAutoMovieVector3[] = (
  points: readonly IAutoMovieVector3[],
): IAutoMovieVector3[] => {
  const seen: Set<string> = new Set<string>();
  const out: IAutoMovieVector3[] = [];
  for (const p of points) {
    const key: string = `${p.x},${p.z}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
};
