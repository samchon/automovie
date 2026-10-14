import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { PLANAR_EPSILON } from "./constants/PLANAR_EPSILON";
import { planarCross } from "./planarCross";

/**
 * Whether two closed segments share any point, touching included.
 *
 * Touching counts because a region whose rings meet at one point is not two
 * regions with a shared corner; it is a surface pinched to a line, the same
 * shape `buildAutoMovieWall` refuses when two openings meet at a corner. A
 * proper crossing needs each segment's endpoints on strictly opposite sides of
 * the other's line, each side more than `PLANAR_EPSILON` from zero; otherwise
 * the segments meet when an endpoint of one is collinear with the other within
 * that absolute tolerance and its projection parameter lies in [0, 1] widened
 * by the same constant. A zero-length segment never reports a touch through
 * its own projection.
 *
 * @param fromA First endpoint of the first segment.
 * @param toA Second endpoint of the first segment.
 * @param fromB First endpoint of the second segment.
 * @param toB Second endpoint of the second segment.
 * @returns True when the closed segments share a point within tolerance.
 *
 * @evidence contracts/common.md#principled-implementation The orientation test for a proper crossing plus the four endpoint-on-segment cases, which together cover every way two closed segments can meet; collinearity uses the absolute `PLANAR_EPSILON` the free-form region kernel defines for millimetre-scale arcs.
 * @evidence contracts/common.md#clear-and-simple-design Shared by region validation and hole bridging, which previously each kept an identical private copy, so a ring pair refused by validation is exactly the pair a bridge must not cross.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No ring, label or caller changes the tolerance; the architecture graph's scale-relative `segmentsTouch` is a different contract and is not imitated here.
 * @evidence contracts/common.md#meaningful-documentation States why touching counts, the exact crossing and contact rules with their tolerance, and the zero-length segment behaviour.
 * @evidence contracts/performance.md#efficient-algorithms Constant time, at most eight orientation determinants; the contact candidates are a fixed four-entry table built per call.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A constant-time pure predicate; its callers iterate pairs and nothing is worth caching between them.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates one four-entry table per call and returns a boolean, keeping no reference to it or the points.
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

/** Are two orientation values strictly on opposite sides of zero? */
const straddles = (left: number, right: number): boolean =>
  Math.abs(left) > PLANAR_EPSILON &&
  Math.abs(right) > PLANAR_EPSILON &&
  left * right < 0;
