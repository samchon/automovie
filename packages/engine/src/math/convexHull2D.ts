import { IAutoMovieVector3 } from "@automovie/interface";

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
export const convexHull2D: (
  points: readonly IAutoMovieVector3[],
) => IAutoMovieVector3[] = (
  points: readonly IAutoMovieVector3[],
): IAutoMovieVector3[] => {
  const unique: IAutoMovieVector3[] = dedupeXZ(points);
  if (unique.length <= 2) return unique;
  const sorted: IAutoMovieVector3[] = [...unique].sort(
    (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
      a.x - b.x || a.z - b.z,
  );
  const lower: IAutoMovieVector3[] = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0
    )
      lower.pop();
    lower.push(p);
  }
  const upper: IAutoMovieVector3[] = [];
  for (let i: number = sorted.length - 1; i >= 0; i--) {
    const p: IAutoMovieVector3 = sorted[i]!;
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0
    )
      upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  const hull: IAutoMovieVector3[] = [...lower, ...upper];
  // All input points collinear → the chain collapses to the two extremes.
  return hull.length >= 3 ? hull : dedupeXZ(hull);
};

const cross: (
  o: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
) => number = (
  o: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);

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
