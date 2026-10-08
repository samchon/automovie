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
 * @evidence contracts/common.md#principled-implementation Consecutive directed differences test the exact represented height-graph conditions, with original endpoint orientation and witnesses.
 * @evidence contracts/common.md#clear-and-simple-design One predicate owner supplies candidate and final measurement consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither sorting, approximate ties nor substituted source points changes the predicate.
 * @evidence contracts/common.md#meaningful-documentation States the accepted tie condition, full span and diagnostic ownership.
 * @evidence contracts/modeling.md#spatial-conventions Supplied points and projected readings remain canonical head-frame metres.
 * @evidence contracts/modeling.md#shared-boundaries Reads the actual upper/lower contact courses through one condition.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly observes the courses.
 * @evidenceExclude contracts/anatomy.md#anatomical-source This projection predicate is not a clinical norm.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal input.
 * @author Samchon
 */
export function readHumanFaceMarginGraphViolations(
  points: IHumanFaceLipMarginPoints,
  axis: readonly [number, number, number],
  up: IAutoMovieVector3,
): IHumanFaceMarginGraphViolation[] {
  const along = (point: IHumanFaceLipMarginPoint) =>
    point.point.x * axis[0] + point.point.y * axis[1] + point.point.z * axis[2];
  const height = (point: IHumanFaceLipMarginPoint) =>
    point.point.x * up.x + point.point.y * up.y + point.point.z * up.z;
  return [points.upper, points.lower].flatMap((course, side) => {
    const direction = Math.sign(along(course[course.length - 1]) - along(course[0]));
    const describe = (first: IHumanFaceLipMarginPoint, second: IHumanFaceLipMarginPoint,
      ordinal: number, reason: IHumanFaceMarginGraphViolation["reason"]): IHumanFaceMarginGraphViolation => ({
        course: side === 0 ? "upper" : "lower", ordinal, reason, direction,
        first, second, firstAlongMetres: along(first), secondAlongMetres: along(second),
        firstHeightMetres: height(first), secondHeightMetres: height(second),
      });
    const segments = course.slice(1).flatMap((second, ordinal) => {
      const first = course[ordinal];
      const difference = along(second) - along(first);
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
