import type { IAutoMovieCaptureDrawing } from "../capture/IAutoMovieCaptureDrawing.js";
import type { IAutoMovieInspectionLegendEntry } from "../scene/inspection/IAutoMovieInspectionLegendEntry.js";
import type { IAutoMovieRasterImage } from "../picture/IAutoMovieRasterImage.js";

/** Rows of a stamped label box in font pixels: five glyph rows and two of padding above and below, as the label stamp draws it. */
const ROW: number = 9;

/**
 * Put a picture's legend on the picture itself, in the corner where it hides the least of what was drawn: one row per entry, a square of the entry's colour followed by the label stamp's text `<label> <count>`, so a reader of the still alone knows what each mark colour means.
 *
 * The block is tried in the bottom-left, bottom-right, top-right and top-left corners, in that order; every corner is free, since a contact sheet writes its caption in a strip under each cell rather than over the still. The block goes where the fewest of its pixels differ from the colour of the picture's pixel in that very corner, the background the corner shows, so it covers empty space where the picture has any, and the earlier corner wins a tie. Each swatch is painted now, `ROW × scale` pixels on a side, the height of a stamped label box; the returned labels are the rows' texts, anchored right of their swatches, for the capture run to stamp at the same `scale`. An empty legend paints nothing and returns nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the layout, the corner rule and why every corner is open, what is painted now and what is returned for stamping, the units, and the empty case.
 * @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/passes.md` asks for a legend naming each colour's finding and for labels hidden where they cover what is judged; drawing it into the still keeps it with the picture a vision model reads, the swatch is the exact sRGB colour the inspection drew the kind in, and the corner is chosen by counting the drawn pixels it would hide, measured on the picture itself.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Measure the block, count each corner's covered pixels, paint the swatches and collect the text anchors; text drawing is the label stamp's.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Entries keep the legend's order and wording; nothing is abbreviated or recoloured, and no corner is fixed for a kind of subject.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the block's area times the four corners tried, plus the swatches' pixels.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure stamp of one picture.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Writes into the picture's own bytes and returns fresh labels.
 */
export function stampAutoMovieDrawLegend(
  picture: IAutoMovieRasterImage,
  legend: readonly IAutoMovieInspectionLegendEntry[],
  scale: number,
): IAutoMovieCaptureDrawing.ILabel[] {
  if (legend.length === 0) return [];
  const { width, height, pixels } = picture;
  const side: number = ROW * scale;
  const texts: string[] = legend.map(
    (entry: IAutoMovieInspectionLegendEntry): string => `${entry.label} ${entry.count}`,
  );

  // The block: swatches, then the widest stamped text box (two pads, four font pixels a character less one).
  const blockWidth: number = Math.min(
    width,
    side + Math.max(...texts.map((text: string): number => 4 * scale + text.length * 4 * scale - scale)),
  );
  const blockHeight: number = Math.min(height, legend.length * side);

  // The corner whose block hides the fewest pixels unlike that corner's own pixel.
  const corners: { left: number; top: number; x: number; y: number }[] = [
    { left: 0, top: height - blockHeight, x: 0, y: height - 1 },
    { left: width - blockWidth, top: height - blockHeight, x: width - 1, y: height - 1 },
    { left: width - blockWidth, top: 0, x: width - 1, y: 0 },
    { left: 0, top: 0, x: 0, y: 0 },
  ];
  let best: { left: number; top: number } = corners[0]!;
  let fewest: number = Number.POSITIVE_INFINITY;
  for (const corner of corners) {
    const reference: number = (corner.y * width + corner.x) * 4;
    let covered: number = 0;
    for (let y: number = corner.top; y < corner.top + blockHeight; y++)
      for (let x: number = corner.left; x < corner.left + blockWidth; x++) {
        const offset: number = (y * width + x) * 4;
        if (
          pixels[offset] !== pixels[reference] ||
          pixels[offset + 1] !== pixels[reference + 1] ||
          pixels[offset + 2] !== pixels[reference + 2]
        )
          covered++;
      }
    if (covered < fewest) {
      fewest = covered;
      best = corner;
    }
  }

  // Swatches now, texts for the run to stamp.
  return legend.map(
    (entry: IAutoMovieInspectionLegendEntry, index: number): IAutoMovieCaptureDrawing.ILabel => {
      const top: number = best.top + index * side;
      for (let y: number = Math.max(0, top); y < Math.min(height, top + side); y++)
        for (let x: number = best.left; x < Math.min(width, best.left + side); x++) {
          const offset: number = (y * width + x) * 4;
          pixels[offset] = (entry.color >> 16) & 0xff;
          pixels[offset + 1] = (entry.color >> 8) & 0xff;
          pixels[offset + 2] = entry.color & 0xff;
          pixels[offset + 3] = 255;
        }
      return { text: texts[index]!, x: best.left + side, y: top };
    },
  );
}
