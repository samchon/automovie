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
