/**
 * Size the cell a still takes on a contact sheet: the still's proportions with the longer side at 320 pixels, and no side below one pixel.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the fixed length and the floor.
 * @evidence contracts/development/implementation.md#principled-implementation A longer side of 320 pixels keeps a figure and its caption legible while a sheet of fifty cells stays one readable picture, and the still's own proportions keep a portrait raster upright.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One scale, applied to both sides.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The short side of a very long still stays one pixel instead of rounding to a zero the sheet would refuse.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A layout that states its raster and a run that learns it from the first still size their cells through this one function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns two numbers and keeps nothing.
 */
export function sizeCaptureSheetCell(
  width: number,
  height: number,
): {
  /** Cell width in pixels. */
  width: number;

  /** Cell height in pixels. */
  height: number;
} {
  const scale: number = 320 / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
