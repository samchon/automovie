import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * Twice the signed area of the triangle `origin -> from -> to`, in square
 * metres: positive for a counter-clockwise turn, negative for clockwise, and
 * zero for collinear points.
 *
 * It is the free-form region kernel's raw orientation measure; callers compare
 * it against the absolute `PLANAR_EPSILON`. The architecture graph's
 * `planarSide` asks the same question with a tolerance that grows with the
 * figure, which is why the two are not merged.
 *
 * @param origin Shared corner of both edges.
 * @param from End of the first edge.
 * @param to End of the second edge.
 * @returns `(from - origin) x (to - origin)`.
 */
export const planarCross = (
  origin: IAutoMoviePlanarPoint,
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
): number =>
  (from.x - origin.x) * (to.y - origin.y) -
  (from.y - origin.y) * (to.x - origin.x);
