import {
  decodeAutoMovieRasterPng,
  encodeAutoMovieRasterPng,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `decodeAutoMovieRasterPng` reads back the PNG `encodeAutoMovieRasterPng`
 * writes.
 *
 * Scenarios:
 *
 * 1. An RGBA PNG gives its size and all four channels.
 * 2. An RGB PNG gives opaque pixels.
 * 3. Bytes that are not a PNG are refused.
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
  const rgba = await decodeAutoMovieRasterPng(
    await encodeAutoMovieRasterPng(raster, { alpha: true }),
  );
  TestValidator.equals("size", [rgba.width, rgba.height], [2, 1]);
  TestValidator.equals("rgba", [...rgba.pixels], [...pixels]);
  const rgb = await decodeAutoMovieRasterPng(
    await encodeAutoMovieRasterPng(raster),
  );
  TestValidator.equals(
    "rgb",
    [...rgb.pixels],
    [10, 20, 30, 255, 40, 50, 60, 255],
  );
  await TestValidator.error("not a png", async (): Promise<void> => {
    await decodeAutoMovieRasterPng(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  });
}