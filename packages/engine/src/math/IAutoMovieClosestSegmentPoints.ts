import { IAutoMovieVector3 } from "@automovie/interface";
/**
 * The closest pair of points between two bounded segments `a→b` and `c→d`,
 * and their separation, as `closestPointsBetweenSegments` returns them.
 *
 * Coordinates and the distance are in the inputs' unit, metres for scene
 * geometry. Both points are newly allocated and owned by the caller. When the
 * minimum is not unique, as for parallel overlapping segments, the pair with
 * the lowest parameter on the first segment, then on the second, is chosen.
 * The values are rounded binary64 witnesses, not a certified lower bound on
 * the separation.
 *
 * @evidence contracts/common.md#principled-implementation Records the minimiser of the constrained quadratic `|r + s·u − t·v|` over the unit square that `closestPointsBetweenSegments` solves; the distance is measured between the two returned points, so the three fields always agree.
 * @evidence contracts/common.md#clear-and-simple-design The two witness points and their distance, what body collision and convex separation read; the segment parameters stay internal because no consumer needs them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A plain result record with no caller-specific field; the tie rule is a canonical choice applied to every input.
 * @evidence contracts/common.md#meaningful-documentation States which segment each point lies on, the unit, ownership, the tie rule, and that the values are rounded witnesses rather than a certified bound.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A result record with no algorithm; the closest-pair search is answered on `closestPointsBetweenSegments`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The witness pair belongs to the two segments supplied to one query; the distance-only adapter consumes that same pair without storing it for later coordinates.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two points and one number owned by the caller; nothing else is retained.
 * @author Samchon
 */
export interface IAutoMovieClosestSegmentPoints {
  /** Point on the first segment `a→b`. */
  pointA: IAutoMovieVector3;

  /** Point on the second segment `c→d`. */
  pointB: IAutoMovieVector3;

  /** Euclidean distance between `pointA` and `pointB`; finite and non-negative. */
  distance: number;
}
