import type { IAutoMovieRasterImage } from "../picture/IAutoMovieRasterImage.js";

/** Dark red, which no inspection shade fills a whole cell with, so the cell reads as a gap and not as a dark still. */
const MARK: readonly [number, number, number] = [96, 16, 16];

/**
 * The picture a sheet shows in place of a still that does not exist: a cell whose draw failed, or the missing side or difference of a comparison row.
 *
 * `.agents/skills/visual-debugging/capture.md` keeps a cell that could not be drawn on the sheet with its cause, so the gap stays visible in the cell's place; the caption beside it says why.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the picture stands for, its two consumers and why it is kept on the sheet.
 * @evidence contracts/development/implementation.md#principled-implementation One opaque colour over the cell's own size, so the sheet copies it without reduction.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One fill.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The colour is a fixed marker chosen to differ from a drawn still's background, not a measured value.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the cell's pixels.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A cell-sized picture is cheap and each sheet copies it once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one cell-sized picture and keeps nothing.
 */
export function markAutoMovieCaptureCell(cell: {
  /** Cell width in pixels. */
  width: number;

  /** Cell height in pixels. */
  height: number;
}): IAutoMovieRasterImage {
  const pixels: Uint8ClampedArray = new Uint8ClampedArray(
    cell.width * cell.height * 4,
  );
  for (let offset: number = 0; offset < pixels.length; offset += 4)
    pixels.set([...MARK, 255], offset);
  return { width: cell.width, height: cell.height, pixels };
}
