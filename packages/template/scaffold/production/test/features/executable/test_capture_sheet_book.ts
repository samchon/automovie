import type { IAutoMovieRasterImage } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

import type { CaptureDirectory } from "../../../src/executable/CaptureDirectory";
import { CaptureSheetBook } from "../../../src/executable/CaptureSheetBook";

/**
 * Pin when a capture run's contact sheets are finished, what each carries, and which sheet layouts are refused.
 *
 * Scenarios:
 * 1. A sheet is handed back by the still that fills it, with its name, its index and a picture of the layout's cells; the stills left over when the run closes come back as a shorter last sheet, and a book with nothing left hands back none.
 * 2. Without a stated raster each sheet takes its cell size from the first still put on it, so a run whose stills change raster keeps each sheet's proportions.
 * 3. A second sheet that would take the name of an earlier one is refused.
 * 4. A cell, column or view count that is not a positive integer, a sheet with fewer cells than one second has views and a sheet too large for the stated raster are refused when the book is made; the too large sheet without a stated raster is refused by its first still.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the four scenarios and what each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the book's constructor, add and finish and asserts each returned sheet's name, index and picture size and each refusal; a sheet finished a still early or late, a lost last sheet, a cell size kept from an earlier raster, a replaced sheet name, swapped cell and column counts or a missed refusal fails.
 * @evidence contracts/development/testing.md#independent-expectations Names follow the documented `sheet-<from>-<to>.png` form with seconds written by hand, picture sizes are counted by hand from cells whose longer side is the documented 320 pixels, and the too large sheet is 2000 cells of 320 by 180 pixels in ten columns against the viewer sheet's documented 64 megapixels.
 * @evidence contracts/development/testing.md#distinguishing-cases A full sheet and a short last one, a stated and an unstated raster, an upright and a lying still, a repeated second, each refusal once, and beside the refusals the nearest admitted layouts: a sheet with exactly as many cells as one second has views, and the too large sheet until a still tells its raster.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with literal layouts and pictures built in memory, discovered by test/index.ts as an exported test_ function; it reads and writes no file.
 */
export function test_capture_sheet_book(): void {
  const layout = (
    perSheet: number,
    columns: number,
    views: number = 1,
    raster?: { width: number; height: number },
  ): CaptureSheetBook.ILayout => ({
    perSheet,
    columns,
    views,
    raster,
  });
  const picture = (width: number, height: number): IAutoMovieRasterImage => ({
    width,
    height,
    pixels: new Uint8ClampedArray(width * height * 4).fill(255),
  });
  const still = (seconds: number): CaptureDirectory.ICell => ({
    file: `t00${seconds.toFixed(3)}.png`,
    seconds,
    view: undefined,
    caption: `${seconds.toFixed(2)}s`,
  });
  const size = (
    sheet: CaptureSheetBook.ISheet | undefined,
  ): [number, number] | undefined =>
    sheet === undefined ? undefined : [sheet.image.width, sheet.image.height];

  // 1. Two cells of 160 by 320 pixels in one column, from a stated raster.
  const book: CaptureSheetBook = new CaptureSheetBook(
    layout(2, 1, 1, { width: 4, height: 8 }),
  );
  TestValidator.predicate(
    "a book without stills has no last sheet",
    book.finish() === undefined,
  );
  TestValidator.predicate(
    "the first still does not fill the sheet",
    book.add(picture(4, 8), still(0)) === undefined,
  );
  const full: CaptureSheetBook.ISheet | undefined = book.add(
    picture(4, 8),
    still(0.2),
  );
  TestValidator.equals(
    "the second still fills it",
    { file: full?.file, index: full?.index, size: size(full) },
    {
      file: "sheet-000.000-000.200.png",
      index: {
        columns: 1,
        cellWidth: 160,
        cellHeight: 320,
        cells: [
          { row: 0, column: 0, seconds: 0, file: "t000.000.png" },
          { row: 1, column: 0, seconds: 0.2, file: "t000.200.png" },
        ],
      },
      size: [160, 640],
    },
  );
  TestValidator.predicate(
    "the third still starts the next sheet",
    book.add(picture(4, 8), still(0.4)) === undefined,
  );
  const last: CaptureSheetBook.ISheet | undefined = book.finish();
  TestValidator.equals(
    "the last sheet is cut to its one still",
    { file: last?.file, cells: last?.index.cells.length, size: size(last) },
    { file: "sheet-000.400-000.400.png", cells: 1, size: [160, 320] },
  );
  TestValidator.predicate(
    "a finished book has no further sheet",
    book.finish() === undefined,
  );

  // 2. Each sheet takes its cell size from its own first still.
  const mixed: CaptureSheetBook = new CaptureSheetBook(layout(1, 1));
  TestValidator.equals(
    "a lying still",
    size(mixed.add(picture(8, 4), still(0))),
    [320, 160],
  );
  TestValidator.equals(
    "an upright still after it",
    size(mixed.add(picture(4, 8), still(0.2))),
    [160, 320],
  );

  // 3. One second handed over twice to a layout of one view.
  const repeated: CaptureSheetBook = new CaptureSheetBook(layout(1, 1));
  repeated.add(picture(4, 8), still(1));
  TestValidator.error(
    "a second sheet of the same seconds",
    (): CaptureSheetBook.ISheet | undefined =>
      repeated.add(picture(4, 8), still(1)),
  );

  // 4. Refused layouts.
  for (const [label, refused] of [
    ["no cells", layout(0, 2)],
    ["no columns", layout(2, 0)],
    ["a fractional cell count", layout(2.5, 2)],
    ["no views", layout(2, 2, 0)],
    ["a fractional view count", layout(2, 2, 1.5)],
    ["fewer cells than one second's views", layout(1, 1, 2)],
    // 2000 cells of 320 by 180 pixels in ten columns are 3200 by 36000 pixels, over the sheet's 64 megapixels.
    [
      "too large for the stated raster",
      layout(2000, 10, 1, { width: 16, height: 9 }),
    ],
  ] as const)
    TestValidator.error(
      label,
      (): CaptureSheetBook => new CaptureSheetBook(refused),
    );
  TestValidator.predicate(
    "as many cells as one second's views",
    new CaptureSheetBook(layout(2, 1, 2)).finish() === undefined,
  );
  const late: CaptureSheetBook = new CaptureSheetBook(layout(2000, 10));
  TestValidator.error(
    "too large once the first still tells the raster",
    (): CaptureSheetBook.ISheet | undefined =>
      late.add(picture(16, 9), still(0)),
  );
}
