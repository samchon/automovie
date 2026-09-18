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
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Builds the ordered support polygon used to evaluate whether a subject remains carried by its contacts.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Builds the ordered support polygon used to evaluate whether a subject remains carried by its contacts.
 * @author Samchon
 */
export const convexHull2D = (
  points: readonly IAutoMovieVector3[],
): IAutoMovieVector3[] => {
  const unique = dedupeXZ(points);
  if (unique.length <= 2) return unique;
  const sorted = [...unique].sort((a, b) => a.x - b.x || a.z - b.z);
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
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]!;
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0
    )
      upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  const hull = [...lower, ...upper];
  // All input points collinear → the chain collapses to the two extremes.
  return hull.length >= 3 ? hull : dedupeXZ(hull);
};
