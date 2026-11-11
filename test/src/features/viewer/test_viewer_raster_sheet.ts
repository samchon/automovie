import {
  AutoMovieRasterSheet,
  type IAutoMovieRasterImage,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * A contact sheet lays its pictures out in row-major cells, reduces each by
 * area average, captions it, and finishes as a picture of the cells that were
 * filled.
 *
 * Scenarios:
 *
 * 1. Six 8 by 12 pictures in three columns finish as a 24 by 24 picture with
 *    each colour in its own cell, a dark caption box in the cell's corner and
 *    the caption's glyph in white.
 * 2. A 16 by 24 picture whose columns alternate between 0 and 200 lands in an
 *    8 by 12 cell as 100 everywhere outside the caption.
 * 3. A sheet of fifty cells in ten columns holding two pictures finishes 16
 *    by 12, holding three of six in three columns finishes 24 by 12, and
 *    holding four of six finishes 24 by 24 with the two unfilled cells black.
 * 4. A sheet of two cells laid out in ten columns finishes 16 by 12.
 * 5. A picture finished from a partly filled sheet keeps its size and pixels
 *    when another picture is added, and the next finish includes that picture.
 * 6. Finishing an empty sheet, adding to a full sheet, a zero, negative or
 *    fractional capacity, column count or cell size, and a sheet above 64
 *    megapixels are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Fills real sheets through the public constructor, `add` and `finish` and reads the finished picture's size and pixels; a sheet that kept its empty rows, copied rows with the wrong stride, point-sampled a reduction or returned a picture a later `add` rewrites fails.
 * @evidence contracts/development/testing.md#independent-expectations Sizes are the filled columns and rows times the authored cell size, colours are the ones this test paints, the average of 0 and 200 is 100, and the caption pixels follow the documented 3 by 5 font and two-pixel margin, all written by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases A full sheet against sheets short by rows, by columns and by both, a ragged last row against a whole one, a capacity below the column count, a finished picture before and after a later `add`, and each refusal against the accepted call.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own pictures in memory and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Six 8 by 12 pictures in three columns finish as a 24 by 24 picture).
 */
export function test_viewer_raster_sheet(): void {
  const picture = (
    width: number,
    height: number,
    red: (x: number) => number,
  ): IAutoMovieRasterImage => {
    const pixels: Uint8ClampedArray = new Uint8ClampedArray(width * height * 4);
    for (let y: number = 0; y < height; y++)
      for (let x: number = 0; x < width; x++)
        pixels.set([red(x), 40, 80, 255], (y * width + x) * 4);
    return { width, height, pixels };
  };
  const flat = (red: number): IAutoMovieRasterImage =>
    picture(8, 12, (): number => red);
  const at = (image: IAutoMovieRasterImage, x: number, y: number): number[] =>
    Array.from(
      image.pixels.subarray(
        (y * image.width + x) * 4,
        (y * image.width + x) * 4 + 4,
      ),
    );
  const size = (image: IAutoMovieRasterImage): number[] => [
    image.width,
    image.height,
    image.pixels.length,
  ];
  const filled = (
    capacity: number,
    columns: number,
    count: number,
  ): AutoMovieRasterSheet => {
    const sheet: AutoMovieRasterSheet = new AutoMovieRasterSheet(
      capacity,
      columns,
      8,
      12,
    );
    for (let i: number = 0; i < count; i++) sheet.add(flat(10 * (i + 1)), "1");
    return sheet;
  };

  // 1. A full sheet, cell by cell.
  const full: IAutoMovieRasterImage = filled(6, 3, 6).finish();
  TestValidator.equals(
    "six cells in three columns",
    size(full),
    [24, 24, 2304],
  );
  TestValidator.equals(
    "each picture lands in its row-major cell",
    [0, 1, 2, 3, 4, 5].map(
      (i: number): number =>
        at(full, (i % 3) * 8 + 7, Math.floor(i / 3) * 12 + 11)[0]!,
    ),
    [10, 20, 30, 40, 50, 60],
  );
  TestValidator.equals(
    "the cell keeps the picture's other channels, opaque",
    at(full, 7, 11),
    [10, 40, 80, 255],
  );
  TestValidator.equals(
    "the caption box darkens the cell's corner",
    [at(full, 0, 0), at(full, 16, 12)],
    [
      [16, 16, 16, 255],
      [16, 16, 16, 255],
    ],
  );
  TestValidator.equals(
    "the caption's glyph is white, two pixels in from the corner",
    [at(full, 3, 2), at(full, 19, 14)],
    [
      [255, 255, 255, 255],
      [255, 255, 255, 255],
    ],
  );

  // 2. Reduction by area average.
  const reduced: AutoMovieRasterSheet = new AutoMovieRasterSheet(1, 1, 8, 12);
  reduced.add(
    picture(16, 24, (x: number): number => (x % 2 === 0 ? 0 : 200)),
    "",
  );
  TestValidator.equals(
    "alternating columns average to their mean",
    [at(reduced.finish(), 7, 11), at(reduced.finish(), 4, 0)],
    [
      [100, 40, 80, 255],
      [100, 40, 80, 255],
    ],
  );

  // 3. Partly filled sheets.
  const two: IAutoMovieRasterImage = filled(50, 10, 2).finish();
  TestValidator.equals(
    "two of fifty cells finish as two cells",
    size(two),
    [16, 12, 768],
  );
  TestValidator.equals(
    "the second cell follows the first in the narrower picture",
    [at(two, 7, 11), at(two, 15, 11), at(two, 11, 2)],
    [
      [10, 40, 80, 255],
      [20, 40, 80, 255],
      [255, 255, 255, 255],
    ],
  );
  TestValidator.equals(
    "one whole row of two finishes as that row",
    size(filled(6, 3, 3).finish()),
    [24, 12, 1152],
  );
  const ragged: IAutoMovieRasterImage = filled(6, 3, 4).finish();
  TestValidator.equals(
    "a ragged last row is kept whole",
    size(ragged),
    [24, 24, 2304],
  );
  TestValidator.equals(
    "its filled cell is drawn and its unfilled cells are black",
    [at(ragged, 7, 23), at(ragged, 15, 23), at(ragged, 8, 12)],
    [
      [40, 40, 80, 255],
      [0, 0, 0, 255],
      [0, 0, 0, 255],
    ],
  );

  // 4. Fewer cells than columns.
  TestValidator.equals(
    "two cells laid out in ten columns are two cells wide",
    size(filled(2, 10, 2).finish()),
    [16, 12, 768],
  );

  // 5. A finished picture is not rewritten.
  const growing: AutoMovieRasterSheet = filled(6, 3, 1);
  const first: IAutoMovieRasterImage = growing.finish();
  const before: number[] = Array.from(first.pixels);
  growing.add(flat(90), "1");
  TestValidator.equals(
    "the earlier picture keeps its size and pixels",
    [size(first), Array.from(first.pixels)],
    [[8, 12, 384], before],
  );
  TestValidator.equals(
    "the next finish holds both pictures",
    [size(growing.finish()), at(growing.finish(), 15, 11)],
    [
      [16, 12, 768],
      [90, 40, 80, 255],
    ],
  );

  // 6. Refusals.
  TestValidator.error("an empty sheet is refused", (): void => {
    new AutoMovieRasterSheet(4, 2, 8, 12).finish();
  });
  TestValidator.error("a picture beyond the capacity is refused", (): void => {
    filled(2, 2, 2).add(flat(0), "1");
  });
  for (const value of [0, -1, 1.5, Number.NaN])
    for (const position of [0, 1, 2, 3])
      TestValidator.error(
        `a size of ${value} in argument ${position} is refused`,
        (): void => {
          const sizes: [number, number, number, number] = [4, 2, 8, 12];
          sizes[position] = value;
          new AutoMovieRasterSheet(...sizes);
        },
      );
  TestValidator.error("a sheet above 64 megapixels is refused", (): void => {
    new AutoMovieRasterSheet(1, 1, 8001, 8000);
  });
}
