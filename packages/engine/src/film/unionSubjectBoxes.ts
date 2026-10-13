import { IAutoMovieSubjectBox } from "./IAutoMovieSubjectBox";

/**
 * The smallest box containing every given box, or null when none were given.
 *
 * The corners are folded one box at a time rather than spread into
 * `Math.min`, so a union over hundreds of thousands of part boxes, such as a
 * building's contents, returns a box instead of throwing a `RangeError` for
 * too many call arguments. A `NaN` corner propagates into the result. The
 * returned box is new; the input boxes are not modified.
 *
 * @evidence contracts/common.md#principled-implementation The union of axis-aligned boxes is the per-axis minimum of the minimum corners and maximum of the maximum corners, computed by a left fold whose `Math.min` and `Math.max` are exact, so the order of the boxes does not change the result.
 * @evidence contracts/common.md#clear-and-simple-design One fold over the list with no options; the empty case answers null so a caller distinguishes "no subject" from a real point box.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Treats every box alike and caps no input size; the argument-count limit of a spread call is removed by folding, not caught and retried.
 * @evidence contracts/common.md#meaningful-documentation States the null for an empty list, that any list length is accepted, the `NaN` propagation, and that the result is a new box leaving the inputs untouched.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the boxes with constant extra space, replacing six mapped arrays and six spread calls over them.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure fold over the given list that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the one returned box.
 */
export const unionSubjectBoxes = (
  boxes: readonly IAutoMovieSubjectBox[],
): IAutoMovieSubjectBox | null => {
  if (boxes.length === 0) return null;
  const union: IAutoMovieSubjectBox = {
    min: { ...boxes[0]!.min },
    max: { ...boxes[0]!.max },
  };
  for (const box of boxes) {
    union.min.x = Math.min(union.min.x, box.min.x);
    union.min.y = Math.min(union.min.y, box.min.y);
    union.min.z = Math.min(union.min.z, box.min.z);
    union.max.x = Math.max(union.max.x, box.max.x);
    union.max.y = Math.max(union.max.y, box.max.y);
    union.max.z = Math.max(union.max.z, box.max.z);
  }
  return union;
};
