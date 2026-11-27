import { IAutoMovieSubjectBox } from "@automovie/interface";

/*
 * The smallest box containing every given box, or null when none were given.
 *
 * The corners are folded one box at a time rather than spread into `Math.min`,
 * so a union over hundreds of thousands of part boxes, such as a building's
 * contents, returns a box instead of throwing a `RangeError` for too many call
 * arguments. A `NaN` corner propagates into the result. The returned box is
 * new; the input boxes are not modified.
 */
export function unionSubjectBoxes(
  boxes: readonly IAutoMovieSubjectBox[],
): IAutoMovieSubjectBox | null {
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
}
