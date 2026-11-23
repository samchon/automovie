import type { IAutoMovieRasterImage } from "@automovie/interface";
import {
  decodeAutoMovieRasterPng,
  encodeAutoMovieRasterPng,
  planGuidePassOutputs,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * The graphics plate is planned as a pass and written as an RGBA PNG that keeps
 * its straight alpha.
 *
 * Scenarios:
 *
 * 1. Planning the `beauty` and `graphics` passes lists a `graphics` output.
 * 2. A plate raster with one opaque red pixel and one fully transparent pixel,
 *    written with alpha, decodes with PNG colour type 6 and the same four
 *    channels per pixel.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the plan and the raster the test pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public pass planner, encoder and decoder and reads the IHDR colour type and the decoded pixels.
 * @evidence contracts/development/testing.md#independent-expectations Colour type 6 is PNG's RGBA type (W3C PNG, 2nd edition, section 11.2.2); the expected pixels are the authored ones.
 * @evidence contracts/development/testing.md#distinguishing-cases An RGB plate (type 2) or a dropped alpha fails. The control writer's choice of alpha for the graphics pass is exercised by the render path.
 * @evidence contracts/development/testing.md#execution-ownership In-memory planning and PNG bytes; no browser.
 */
export async function test_capture_graphics_plate_png(): Promise<void> {
  const outputs: { pass: string }[] = planGuidePassOutputs({
    passes: ["beauty", "graphics"],
    frames: 2,
  } as Parameters<typeof planGuidePassOutputs>[0]) as { pass: string }[];
  TestValidator.predicate(
    "the plan lists the graphics pass",
    outputs.some(
      (output: { pass: string }): boolean => output.pass === "graphics",
    ),
  );

  const plate: IAutoMovieRasterImage = {
    width: 2,
    height: 1,
    pixels: new Uint8Array([255, 0, 0, 255, 0, 0, 0, 0]),
  } as IAutoMovieRasterImage;
  const bytes: Uint8Array = await encodeAutoMovieRasterPng(plate, {
    alpha: true,
  });
  TestValidator.equals("PNG colour type 6", bytes[25], 6);
  const decoded: IAutoMovieRasterImage = await decodeAutoMovieRasterPng(bytes);
  TestValidator.equals(
    "straight alpha kept",
    Array.from(decoded.pixels),
    [255, 0, 0, 255, 0, 0, 0, 0],
  );
}
