import {
  type IAutoMovieCaptureDrawing,
  type IAutoMovieRasterImage,
  stampAutoMovieDrawLegend,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * A still's legend goes in the corner where it hides the fewest drawn pixels, never under the sheet caption's top-left corner, with a swatch of each kind's colour and its text beside it.
 *
 * Scenarios:
 *
 * 1. On an empty 100 by 60 grey picture, a legend of two kinds at scale 1 stacks in the bottom-left corner: swatches 9 pixels square at rows 42 and 51, texts anchored at x 9.
 * 2. With a figure drawn in the bottom-left corner, the same legend moves to the bottom-right corner, leaving the figure's pixels untouched.
 * 3. With figures in both bottom corners, it moves to the top-right corner.
 * 4. With every corner drawn, the bottom-left corner is kept as the first choice among equals.
 * 5. An empty legend paints nothing and returns nothing.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Stamps legends on hand-made pictures and reads the returned anchors and the painted pixels; a legend fixed to one corner, placed over a drawn figure, placed under the caption or painting without a legend fails.
 * @evidence contracts/development/testing.md#independent-expectations Positions follow from the label stamp's box height of nine font pixels and the picture sizes written here; the figures are drawn by this test, so which corners hold drawn pixels is known without the function.
 * @evidence contracts/development/testing.md#distinguishing-cases Empty, one, two and every corner drawn, and an empty legend. How a cell's drawing carries the legend is owned by `test_draw_cell_call`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_legend_corner`; pictures are in memory and no browser starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_legend_corner(): void {
  const legend: { label: string; color: number; count: number }[] = [
    { label: "trail", color: 0x3070c0, count: 1 },
    { label: "drift", color: 0x7b4fa8, count: 2 },
  ];
  const blank: () => IAutoMovieRasterImage = (): IAutoMovieRasterImage => {
    const pixels: Uint8ClampedArray = new Uint8ClampedArray(100 * 60 * 4);
    for (let offset: number = 0; offset < pixels.length; offset += 4) pixels.set([200, 200, 200, 255], offset);
    return { width: 100, height: 60, pixels };
  };
  const draw: (picture: IAutoMovieRasterImage, left: number, top: number) => void = (
    picture: IAutoMovieRasterImage,
    left: number,
    top: number,
  ): void => {
    for (let y: number = top; y < top + 15; y++)
      for (let x: number = left; x < left + 15; x++) picture.pixels.set([40, 40, 40, 255], (y * 100 + x) * 4);
  };
  const at: (picture: IAutoMovieRasterImage, x: number, y: number) => number[] = (
    picture: IAutoMovieRasterImage,
    x: number,
    y: number,
  ): number[] => Array.from(picture.pixels.subarray((y * 100 + x) * 4, (y * 100 + x) * 4 + 3));

  // 1. Empty picture: bottom-left.
  const empty: IAutoMovieRasterImage = blank();
  const first: IAutoMovieCaptureDrawing.ILabel[] = stampAutoMovieDrawLegend(empty, legend, 1);
  TestValidator.equals("bottom-left anchors", first, [
    { text: "trail 1", x: 9, y: 42 },
    { text: "drift 2", x: 9, y: 51 },
  ]);
  TestValidator.equals("swatches", [at(empty, 0, 42), at(empty, 8, 59)], [[0x30, 0x70, 0xc0], [0x7b, 0x4f, 0xa8]]);

  // 2. A figure in the bottom-left corner.
  const left: IAutoMovieRasterImage = blank();
  draw(left, 0, 45);
  const second: IAutoMovieCaptureDrawing.ILabel[] = stampAutoMovieDrawLegend(left, legend, 1);
  const width: number = 9 + 4 + 7 * 4 - 1;
  TestValidator.equals("bottom-right anchors", second[0], { text: "trail 1", x: 100 - width + 9, y: 42 });
  TestValidator.equals("the figure is untouched", at(left, 2, 50), [40, 40, 40]);

  // 3. Both bottom corners drawn.
  const bottoms: IAutoMovieRasterImage = blank();
  draw(bottoms, 0, 45);
  draw(bottoms, 85, 45);
  TestValidator.equals("top-right anchors", stampAutoMovieDrawLegend(bottoms, legend, 1)[0], {
    text: "trail 1",
    x: 100 - width + 9,
    y: 0,
  });

  // 4. Every corner drawn.
  const full: IAutoMovieRasterImage = blank();
  for (const [x, y] of [[0, 45], [85, 45], [85, 0], [0, 0]] as const) draw(full, x, y);
  TestValidator.equals("bottom-left among equals", stampAutoMovieDrawLegend(full, legend, 1)[0], {
    text: "trail 1",
    x: 9,
    y: 42,
  });

  // 5. No legend.
  const untouched: IAutoMovieRasterImage = blank();
  TestValidator.equals("nothing returned", stampAutoMovieDrawLegend(untouched, [], 1), []);
  TestValidator.equals("nothing painted", at(untouched, 0, 59), [200, 200, 200]);
}
