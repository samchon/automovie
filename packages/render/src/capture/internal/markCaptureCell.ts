import type { IAutoMovieRasterImage } from "@automovie/interface";

/*
 * The picture a sheet shows in place of a still that does not exist: a cell
 * whose draw failed, or the missing side or difference of a comparison row.
 *
 * `.agents/skills/visual-debugging/capture.md` keeps a cell that could not be
 * drawn on the sheet with its cause, so the gap stays visible in the cell's
 * place; the caption beside it says why.
 */
export function markCaptureCell(cell: {
  /*
   * Cell width in pixels.
   */
  width: number;

  /*
   * Cell height in pixels.
   */
  height: number;
}): IAutoMovieRasterImage {
  const pixels: Uint8ClampedArray = new Uint8ClampedArray(
    cell.width * cell.height * 4,
  );
  for (let offset: number = 0; offset < pixels.length; offset += 4)
    pixels.set([...MARK, 255], offset);
  return { width: cell.width, height: cell.height, pixels };
}

/*
 * Dark red, which no inspection shade fills a whole cell with, so the cell
 * reads as a gap and not as a dark still.
 */
const MARK: readonly [number, number, number] = [96, 16, 16];
