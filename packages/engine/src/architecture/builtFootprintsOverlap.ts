import { IAutoMovieSubjectBox } from "@automovie/interface";

/**
 * Whether two world boxes share plan area on the ground plane.
 *
 * Only the `x` and `z` extents are compared, because a support question asks
 * whether one body stands over another, not whether they meet in height. The
 * comparisons are strict, so two footprints that only touch along an edge or at
 * a corner share no area and answer false.
 *
 * @param left One world box, in metres.
 * @param right The other world box, in metres.
 * @returns True when the two plan rectangles overlap with positive area.
 */
export const builtFootprintsOverlap: (
  left: IAutoMovieSubjectBox,
  right: IAutoMovieSubjectBox,
) => boolean = (
  left: IAutoMovieSubjectBox,
  right: IAutoMovieSubjectBox,
): boolean =>
  Math.max(left.min.x, right.min.x) < Math.min(left.max.x, right.max.x) &&
  Math.max(left.min.z, right.min.z) < Math.min(left.max.z, right.max.z);
