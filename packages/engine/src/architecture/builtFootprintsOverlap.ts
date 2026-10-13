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
 * @evidence contracts/common.md#principled-implementation Two axis-aligned rectangles overlap with positive area exactly when their open intervals intersect on both axes, which four strict comparisons decide; a `NaN` extent compares false and so answers no overlap.
 * @evidence contracts/common.md#clear-and-simple-design One predicate shared by the single-relation support status and the whole-building support sweep, which each spelled the same four comparisons.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No slack and no special case: exact edge contact is excluded by the strict comparisons that define positive-area overlap.
 * @evidence contracts/common.md#meaningful-documentation States the two axes compared and why height is ignored, that edge or corner contact answers false, and the metre unit of the boxes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Four comparisons in constant time, with no algorithm or data structure to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate on two values that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Compares eight stored numbers of two caller-owned boxes and keeps neither box after returning.
 */
export const builtFootprintsOverlap = (
  left: IAutoMovieSubjectBox,
  right: IAutoMovieSubjectBox,
): boolean =>
  left.min.x < right.max.x &&
  left.max.x > right.min.x &&
  left.min.z < right.max.z &&
  left.max.z > right.min.z;
