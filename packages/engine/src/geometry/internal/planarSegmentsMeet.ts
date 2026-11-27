import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { PLANAR_EPSILON } from "../PLANAR_EPSILON";
import { planarCross } from "./planarCross";

/*
 * Whether two closed segments share any point, touching included.
 *
 * Touching counts because a region whose rings meet at one point is not two
 * regions with a shared corner; it is a surface pinched to a line, the same
 * shape `buildAutoMovieWall` refuses when two openings meet at a corner. A
 * proper crossing needs each segment's endpoints on strictly opposite sides of
 * the other's line, each side more than `PLANAR_EPSILON` from zero; otherwise
 * the segments meet when an endpoint of one is collinear with the other within
 * that absolute tolerance and its projection parameter lies in [0, 1] widened
 * by the same constant. A zero-length segment never reports a touch through its
 * own projection.
 * Parameter fromA: First endpoint of the first segment.
 * Parameter toA: Second endpoint of the first segment.
 * Parameter fromB: First endpoint of the second segment.
 * Parameter toB: Second endpoint of the second segment.
 * Returns: True when the closed segments share a point within tolerance.
 */
export const planarSegmentsMeet = (
  fromA: IAutoMoviePlanarPoint,
  toA: IAutoMoviePlanarPoint,
  fromB: IAutoMoviePlanarPoint,
  toB: IAutoMoviePlanarPoint,
): boolean => {
  if (
    straddles(planarCross(fromB, toB, fromA), planarCross(fromB, toB, toA)) &&
    straddles(planarCross(fromA, toA, fromB), planarCross(fromA, toA, toB))
  )
    return true;
  const contacts: ReadonlyArray<
    readonly [
      IAutoMoviePlanarPoint,
      IAutoMoviePlanarPoint,
      IAutoMoviePlanarPoint,
    ]
  > = [
    [fromB, toB, fromA],
    [fromB, toB, toA],
    [fromA, toA, fromB],
    [fromA, toA, toB],
  ];
  return contacts.some(
    ([from, to, point]: readonly [
      IAutoMoviePlanarPoint,
      IAutoMoviePlanarPoint,
      IAutoMoviePlanarPoint,
    ]): boolean => {
      if (Math.abs(planarCross(from, to, point)) > PLANAR_EPSILON) return false;
      const spanX: number = to.x - from.x;
      const spanY: number = to.y - from.y;
      const along: number =
        ((point.x - from.x) * spanX + (point.y - from.y) * spanY) /
        (spanX * spanX + spanY * spanY);
      return along >= -PLANAR_EPSILON && along <= 1 + PLANAR_EPSILON;
    },
  );
};

/*
 * Are two orientation values strictly on opposite sides of zero?
 */
const straddles = (left: number, right: number): boolean =>
  Math.abs(left) > PLANAR_EPSILON &&
  Math.abs(right) > PLANAR_EPSILON &&
  left * right < 0;
