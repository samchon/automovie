import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IHumanFaceLipMarginPoint } from "./IHumanFaceLipMarginPoint";
import type { IHumanFaceLipMarginPoints } from "./IHumanFaceLipMarginPoints";
import type { IHumanFaceMarginGraphViolation } from "./IHumanFaceMarginGraphViolation";

/** Read every original lip graph violation without changing the course.
 * A directed segment must advance along the axis, or keep both along and
 * opening height equal. The complete course must retain an axis span. Equal
 * along/equal height joins remain valid; no numerical epsilon classifies them.
 * Solver candidates use this same predicate as the final aperture owner.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Each finite admitted course projects onto the declared axis/up frame; directed backwards segments, unequal heights at equal along coordinates and a zero complete span produce original endpoint witnesses. Native closure uses these same graph predicates, with no epsilon changing equal joins.
 * @evidence contracts/common.md#clear-and-simple-design Projection and witness formatting remain local to one complete graph scan; the closure caller owns correction and the margin measurement owner owns final admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This reader neither sorts away reversed segments nor changes points. It assumes each admitted course has at least two finite points and finite frame directions; it does not independently certify arbitrary malformed or nonfinite graphs.
 * @evidence contracts/common.md#meaningful-documentation Prose states advance/equal-join/whole-span rules and no epsilon; witnesses retain course, ordinal, direction, original endpoint references and metre projections rather than a repaired course.
 * @evidence contracts/performance.md#efficient-algorithms One pass over M course segments performs fixed-size projections and emits K violations, O(M+K); copied course tails are linear and no pairwise comparison or geometry query occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Direction is fixed once per course and all consumers share this violation rule; changed candidate points require a fresh reading and no success or geometry cache is kept.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most M segment witnesses plus two span witnesses transfer to the caller and borrow point records; local arrays are collectible and no external handle is opened.
 */
export function readHumanFaceMarginGraphViolations(
  points: IHumanFaceLipMarginPoints,
  axis: readonly [number, number, number],
  up: IAutoMovieVector3,
): IHumanFaceMarginGraphViolation[] {
  const along: (point: IHumanFaceLipMarginPoint) => number = (point: IHumanFaceLipMarginPoint): number  =>
    point.point.x * axis[0] + point.point.y * axis[1] + point.point.z * axis[2];
  const height: (point: IHumanFaceLipMarginPoint) => number = (point: IHumanFaceLipMarginPoint): number  =>
    point.point.x * up.x + point.point.y * up.y + point.point.z * up.z;
  return [points.upper, points.lower].flatMap((course: IHumanFaceLipMarginPoint[], side: number): IHumanFaceMarginGraphViolation[]  => {
    const direction: number = Math.sign(along(course[course.length - 1]) - along(course[0]));
    const describe: (first: IHumanFaceLipMarginPoint, second: IHumanFaceLipMarginPoint, ordinal: number, reason: IHumanFaceMarginGraphViolation["reason"]) => IHumanFaceMarginGraphViolation = (first: IHumanFaceLipMarginPoint, second: IHumanFaceLipMarginPoint,
      ordinal: number, reason: IHumanFaceMarginGraphViolation["reason"]): IHumanFaceMarginGraphViolation => ({
        course: side === 0 ? "upper" : "lower", ordinal, reason, direction,
        first, second, firstAlongMetres: along(first), secondAlongMetres: along(second),
        firstHeightMetres: height(first), secondHeightMetres: height(second),
      });
    const segments: IHumanFaceMarginGraphViolation[] = course.slice(1).flatMap((second: IHumanFaceLipMarginPoint, ordinal: number): IHumanFaceMarginGraphViolation[]  => {
      const first: IHumanFaceLipMarginPoint = course[ordinal];
      const difference: number = along(second) - along(first);
      return direction * difference < 0
        ? [describe(first, second, ordinal, "reversed-axis")]
        : difference === 0 && height(second) !== height(first)
          ? [describe(first, second, ordinal, "multiple-heights")] : [];
    });
    return direction === 0
      ? [describe(course[0], course[course.length - 1], -1, "no-axis-span"), ...segments]
      : segments;
  });
}
