import { IAutoMovieVector3 } from "@automovie/interface";
/**
 * Is `point` inside (or on the boundary of) a counter-clockwise hull? Always
 * `false` for a degenerate hull of fewer than three vertices (a point or a
 * segment cannot enclose area).
 *
 * @evidence contracts/common.md#principled-implementation A counter-clockwise convex hull is the intersection of inward XZ half-planes; an absolute square-metre determinant tolerance admits boundaries, and fewer than three vertices enclose no area.
 * @evidence contracts/common.md#clear-and-simple-design One containment predicate serves support margins and hull distance while convexHull2D owns point selection and winding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same determinant tolerance applies to every edge, independent of fixtures or query identity.
 * @evidence contracts/common.md#meaningful-documentation States convex winding prerequisite, inclusive boundary, horizontal coordinates, tolerance units and degenerate false result.
 * @evidence contracts/performance.md#efficient-algorithms At most H edge determinants are evaluated with early outside return, using constant storage and no triangulation.
 * @evidence contracts/performance.md#reuse-equivalent-work Each edge is tested once for the current point; no membership cache outlives mutable hull coordinates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Loop and determinant scalars are the only live state; no hull copy, query history or native resource is acquired.
 */
export const pointInHull: (point: IAutoMovieVector3, hull: readonly IAutoMovieVector3[]) => boolean = (
  point: IAutoMovieVector3,
  hull: readonly IAutoMovieVector3[],
): boolean => {
  if (hull.length < 3) return false;
  for (let i: number = 0; i < hull.length; i++)
    if (cross(hull[i]!, hull[(i + 1) % hull.length]!, point) < -EPSILON)
      return false;
  return true;
};

const EPSILON: number = 1e-9;

const cross: (o: IAutoMovieVector3, a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (
  o: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
