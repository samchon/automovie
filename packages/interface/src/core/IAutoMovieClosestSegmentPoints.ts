import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The closest pair of points between two bounded segments `a→b` and `c→d`, and
 * their separation, as `closestPointsBetweenSegments` returns them.
 *
 * Coordinates and the distance are in the inputs' unit, metres for scene
 * geometry. Both points are newly allocated and owned by the caller. When the
 * minimum is not unique, as for parallel overlapping segments, the pair with
 * the lowest parameter on the first segment, then on the second, is chosen. The
 * values are rounded binary64 witnesses, not a certified lower bound on the
 * separation.
 */
export interface IAutoMovieClosestSegmentPoints {
  /** Point on the first segment `a→b`. */
  pointA: IAutoMovieVector3;

  /** Point on the second segment `c→d`. */
  pointB: IAutoMovieVector3;

  /** Euclidean distance between `pointA` and `pointB`; finite and non-negative. */
  distance: number;
}
