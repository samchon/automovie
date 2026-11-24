import * as render from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `@automovie/render` offers no scene rasterizer: every picture of a scene is drawn by three.js through the draw-only function, and only the picture utilities that work on pixels from any source remain.
 *
 * Scenarios:
 *
 * 1. No export of the package is named for rasterizing, such as `rasterizeAutoMovieScene`, or for submitting primitives to a CPU target.
 * 2. The picture utilities are still exported: the sheet, the comparison, the label stamp, the PNG codec and the image hash.
 */
export function test_unit_render_scene_no_scene_rasterizer(): void {
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
