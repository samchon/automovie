import {
  AutoMovieRasterSheet,
  type IAutoMovieRasterImage,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * Nearest-neighbour reduction keeps the exact colour of the pixel under each cell pixel's centre, where area reduction averages, so a review that reads pixel values sees the values drawn.
 *
 * Scenarios:
 *
 * 1. A 40 by 40 black still with one white pixel at (39, 39) reduced into a 20 by 20 cell keeps that pixel exactly white at cell pixel (19, 19) under `nearest`, whose centre samples source (39, 39), and averages it to 64 under `area`.
 * 2. The same still with its white pixel at (38, 38), which no cell centre samples, reduces to black under `nearest`.
 * 3. A still at the cell's own size is copied pixel for pixel under both reductions.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Fills sheets through the public constructor with each reduction and reads the finished pixels outside the caption; a nearest reduction that averaged, or sampled a corner instead of the centre, fails.
 * @evidence contracts/development/testing.md#independent-expectations The sampled source pixel is floor((x + 0.5) × 40 / 20) = 2x + 1, so cell pixel 19 samples 39 and never 38; the area mean of one 255 among four pixels is 63.75, which a clamped byte array rounds to 64; all worked by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases A sampled pixel against an unsampled one, nearest against area, and reduction against an identity size. Area reduction's other properties are owned by `test_viewer_raster_sheet`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_sheet_nearest`; it builds pictures in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_capture_sheet_nearest(): void {
  const still: (
    size: number,
    white: [number, number][],
  ) => IAutoMovieRasterImage = (
    size: number,
    white: [number, number][],
  ): IAutoMovieRasterImage => {
    const pixels: Uint8ClampedArray = new Uint8ClampedArray(size * size * 4);
    for (let offset: number = 3; offset < pixels.length; offset += 4)
      pixels[offset] = 255;
    for (const [x, y] of white)
      pixels.set([255, 255, 255, 255], (y * size + x) * 4);
    return { width: size, height: size, pixels };
  };
  const reduce: (
    picture: IAutoMovieRasterImage,
    cell: number,
    reduction: "area" | "nearest",
  ) => IAutoMovieRasterImage = (
    picture: IAutoMovieRasterImage,
    cell: number,
    reduction: "area" | "nearest",
  ): IAutoMovieRasterImage => {
    const sheet: AutoMovieRasterSheet = new AutoMovieRasterSheet(
      1,
      1,
      cell,
      cell,
      reduction,
    );
    sheet.add(picture, "");
    return sheet.finish();
  };
  const red: (
    picture: IAutoMovieRasterImage,
    x: number,
    y: number,
  ) => number = (
    picture: IAutoMovieRasterImage,
    x: number,
    y: number,
  ): number => picture.pixels[(y * picture.width + x) * 4]!;

  // 1. A sampled detail; pixels are read at the bottom-right, away from the caption box.
  const detail: IAutoMovieRasterImage = still(40, [[39, 39]]);
  TestValidator.equals(
    "nearest keeps the sampled pixel exactly",
    [
      red(reduce(detail, 20, "nearest"), 19, 19),
      red(reduce(detail, 20, "area"), 19, 19),
    ],
    [255, 64],
  );

  // 2. An unsampled detail.
  TestValidator.equals(
    "nearest skips a pixel no centre samples",
    red(reduce(still(40, [[38, 38]]), 20, "nearest"), 19, 19),
    0,
  );

  // 3. Identity size.
  const same: IAutoMovieRasterImage = still(40, [
    [39, 39],
    [38, 39],
  ]);
  for (const reduction of ["area", "nearest"] as const)
    TestValidator.equals(
      `${reduction} copies a still at the cell's size`,
      [39, 38, 37].map((x: number): number =>
        red(reduce(same, 40, reduction), x, 39),
      ),
      [255, 255, 0],
    );
}
