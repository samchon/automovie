import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The straight distance between two head points, in metres, as a caliper
 * reads it.
 *
 * @evidence contracts/common.md#principled-implementation Every point-pair head reading uses this one distance.
 * @evidence contracts/common.md#clear-and-simple-design One hypot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No projection or arc is substituted.
 * @evidence contracts/common.md#meaningful-documentation States the distance and unit.
 * @evidence contracts/modeling.md#spatial-conventions Metres of the head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 * @author Samchon
 */
export function humanHeadDistance(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
