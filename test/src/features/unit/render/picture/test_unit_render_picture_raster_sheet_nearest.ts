import type { IAutoMovieRasterImage } from "@automovie/interface";
import { AutoMovieRasterSheet } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * Nearest-neighbour reduction keeps the exact colour of the pixel under each
 * cell pixel's centre, where area reduction averages, so a review that reads
 * pixel values sees the values drawn.
 *
 * Scenarios:
 *
 * 1. A 40 by 40 black still with one white pixel at (39, 39) reduced into a 20 by
 *    20 cell keeps that pixel exactly white at cell pixel (19, 19) under
 *    `nearest`, whose centre samples source (39, 39), and averages it to 64
 *    under `area`.
 * 2. The same still with its white pixel at (38, 38), which no cell centre
 *    samples, reduces to black under `nearest`.
 * 3. A still at the cell's own size is copied pixel for pixel under both
 *    reductions.
 */
export function test_unit_render_picture_raster_sheet_nearest(): void {
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
