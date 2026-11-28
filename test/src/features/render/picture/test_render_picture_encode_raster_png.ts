import { AutoMovieRenderPicture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderPicture.encodeRasterPng` writes an 8-bit PNG of the raster.
 *
 * Scenarios:
 *
 * 1. A 2 by 1 raster starts with the PNG signature, then an IHDR of width 2,
 *    height 1, depth 8 and colour type 2 (RGB), and ends with the empty IEND.
 * 2. With alpha the colour type is 6.
 * 3. An empty raster and a mismatched buffer are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Writes the PNG signature, 8-bit header and terminal chunk for RGB and RGBA rasters.
 * @evidence contracts/development/testing.md#behavioral-verification Encodes a 2 × 1 fixture, checks both color types and exercises empty or inconsistent inputs.
 * @evidence contracts/development/testing.md#independent-expectations Literal signature and IHDR bytes pin the dimensions, depth and color types, and the terminal IEND bytes identify a complete structure.
 */
export async function test_render_picture_encode_raster_png(): Promise<void> {
  const raster: { width: number; height: number; pixels: Uint8ClampedArray } = {
    width: 2,
    height: 1,
    pixels: Uint8ClampedArray.from([10, 20, 30, 255, 40, 50, 60, 128]),
  };
  const rgb: Uint8Array = await AutoMovieRenderPicture.encodeRasterPng(raster);
  TestValidator.equals(
    "signature",
    [...rgb.subarray(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  );
  TestValidator.equals(
    "header",
    [...rgb.subarray(16, 26)],
    [0, 0, 0, 2, 0, 0, 0, 1, 8, 2],
  );
  TestValidator.equals(
    "end",
    [...rgb.subarray(rgb.length - 12)],
    [0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82],
  );
  const rgba: Uint8Array = await AutoMovieRenderPicture.encodeRasterPng(
    raster,
    {
      alpha: true,
    },
  );
  TestValidator.equals("alpha colour type", rgba[25], 6);
  await TestValidator.error("empty", async (): Promise<void> => {
    await AutoMovieRenderPicture.encodeRasterPng({
      width: 0,
      height: 1,
      pixels: new Uint8ClampedArray(0),
    });
  });
  await TestValidator.error("mismatch", async (): Promise<void> => {
    await AutoMovieRenderPicture.encodeRasterPng({
      width: 2,
      height: 1,
      pixels: new Uint8ClampedArray(4),
    });
  });
}
