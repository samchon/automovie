import { IAutoMovieSubjectBox } from "@automovie/interface";

/**
 * Whether two world boxes share plan area on the ground plane.
 *
 * Only the `x` and `z` extents are compared, because a support question asks
 * whether one body stands over another, not whether they meet in height. The
 * comparisons are strict, so two footprints that only touch along an edge or
 * at a corner share no area and answer false.
 *
 * @param left One world box, in metres.
 * @param right The other world box, in metres.
 * @returns True when the two plan rectangles overlap with positive area.
 *
 * @evidence contracts/common.md#principled-implementation For ordered finite boxes, positive plan area requires the greater minimum to lie strictly below the lesser maximum on both axes. This also refuses a zero-width or zero-depth footprint inside another box; a `NaN` extent compares false.
 * @evidence contracts/common.md#clear-and-simple-design One predicate shared by the single-relation support status and the whole-building support sweep owns the positive-area interval test.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No slack and no special case: exact edge contact is excluded by the strict comparisons that define positive-area overlap.
 * @evidence contracts/common.md#meaningful-documentation States the two axes compared and why height is ignored, that edge or corner contact answers false, and the metre unit of the boxes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Four extrema and two strict comparisons take constant time, with no input-sized algorithm or data structure.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate on two values that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Compares eight stored numbers of two caller-owned boxes and keeps neither box after returning.
 */
export const builtFootprintsOverlap: (left: IAutoMovieSubjectBox, right: IAutoMovieSubjectBox) => boolean = (
  left: IAutoMovieSubjectBox,
  right: IAutoMovieSubjectBox,
): boolean =>
  Math.max(left.min.x, right.min.x) < Math.min(left.max.x, right.max.x) &&
  Math.max(left.min.z, right.min.z) < Math.min(left.max.z, right.max.z);
