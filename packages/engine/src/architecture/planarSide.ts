import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { PLANAR_EPSILON } from "../geometry/constants/PLANAR_EPSILON";

/**
 * Which side of the directed line `from -> to` a point falls on: `1` left, `-1`
 * right, `0` on the line.
 *
 * The sign is the 2D cross product `(to - from) x (point - from)` with x right
 * and y up. It counts as zero when its magnitude is at most `PLANAR_EPSILON`
 * (1e-12) times the larger of 1 and the Manhattan lengths of `to - from` and
 * `point - from`, so the tolerance grows with the size of the figure and never
 * falls below the absolute floor. A degenerate line, `from` equal to `to`, puts
 * every point on it.
 *
 * @param from Start of the directed line, in the caller's planar frame.
 * @param to End of the directed line, in the same frame.
 * @param point Point to classify, in the same frame.
 * @returns `1`, `-1` or `0` as described above.
 */
export const planarSide: (
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
  point: IAutoMoviePlanarPoint,
) => -1 | 0 | 1 = (
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
  point: IAutoMoviePlanarPoint,
): -1 | 0 | 1 => {
  const cross: number =
    (to.x - from.x) * (point.y - from.y) - (to.y - from.y) * (point.x - from.x);
  const scale: number = Math.max(
    1,
    Math.abs(to.x - from.x) + Math.abs(to.y - from.y),
    Math.abs(point.x - from.x) + Math.abs(point.y - from.y),
  );
  if (Math.abs(cross) <= PLANAR_EPSILON * scale) return 0;
  return cross > 0 ? 1 : -1;
};
