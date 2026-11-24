import * as render from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `@automovie/render` offers no scene rasterizer: every picture of a scene is drawn by three.js through the draw-only function, and only the picture utilities that work on pixels from any source remain.
 *
 * Scenarios:
 *
 * 1. No export of the package is named for rasterizing, such as `rasterizeAutoMovieScene`, or for submitting primitives to a CPU target.
 * 2. The picture utilities are still exported: the sheet, the comparison, the label stamp, the PNG codec and the image hash.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Loads the package's public module and reads the names it exports, so a rasterizer added back to any file the package exports fails scenario 1.
 * @evidence contracts/development/testing.md#independent-expectations The forbidden names are the ones the retired rasterizer used, `rasterize` and `submit...Raster`, and the kept names are those issue #3312 lists as picture utilities.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts the retired rasterizer's names against the picture utilities that share the word `Raster` but draw no scene. Each utility's behaviour belongs to its own tests.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit imports the package in memory and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: No export of the package is named for rasterizing).
 */
export function test_render_no_scene_rasterizer(): void {
  const names: string[] = Object.keys(render);

  // 1. No rasterizer.
  TestValidator.equals(
    "no export rasterizes a scene",
    names.filter((name: string): boolean =>
      /rasteri[sz]e|submit\w*Raster/i.test(name),
    ),
    [],
  );

  // 2. The picture utilities stay.
  TestValidator.equals(
    "the picture utilities are exported",
    [
      "AutoMovieRasterSheet",
      "compareAutoMovieRasters",
      "stampAutoMovieRasterLabel",
      "encodeAutoMovieRasterPng",
      "decodeAutoMovieRasterPng",
      "hashAutoMovieRasterImage",
    ].filter((name: string): boolean => !names.includes(name)),
    [],
  );
}
