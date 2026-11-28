import { AutoMovieRenderPicture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderPicture.decodeRasterPng` reads back the PNG
 * `AutoMovieRenderPicture.encodeRasterPng` writes.
 *
 * Scenarios:
 *
 * 1. An RGBA PNG gives its size and all four channels.
 * 2. An RGB PNG gives opaque pixels.
 * 3. Bytes that are not a PNG are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Reads PNG dimensions and RGB or RGBA channels, supplying opaque alpha to RGB images and refusing invalid bytes.
 * @evidence contracts/development/testing.md#behavioral-verification Decodes tiny RGB and RGBA fixtures made by the encoder and separately passes invalid content.
 * @evidence contracts/development/testing.md#independent-expectations The original explicit dimensions and pixel bytes provide the expected decoded records. Opaque alpha on RGB and invalid input exercise separate branches.
 */
export async function test_render_picture_decode_raster_png(): Promise<void> {
  const pixels: Uint8ClampedArray = Uint8ClampedArray.from([
    10, 20, 30, 255, 40, 50, 60, 128,
  ]);
  const raster: { width: number; height: number; pixels: Uint8ClampedArray } = {
    width: 2,
    height: 1,
    pixels,
  };
  const rgba = await AutoMovieRenderPicture.decodeRasterPng(
    await AutoMovieRenderPicture.encodeRasterPng(raster, { alpha: true }),
  );
  TestValidator.equals("size", [rgba.width, rgba.height], [2, 1]);
  TestValidator.equals("rgba", [...rgba.pixels], [...pixels]);
  const rgb = await AutoMovieRenderPicture.decodeRasterPng(
    await AutoMovieRenderPicture.encodeRasterPng(raster),
  );
  TestValidator.equals(
    "rgb",
    [...rgb.pixels],
    [10, 20, 30, 255, 40, 50, 60, 255],
  );
  await TestValidator.error("not a png", async (): Promise<void> => {
    await AutoMovieRenderPicture.decodeRasterPng(
      Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9]),
    );
  });
}
