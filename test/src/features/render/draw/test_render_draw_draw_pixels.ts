import { AutoMovieRenderDraw } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `encodeDrawPixels` flips a drawn target to rows from the top,
 * averages supersampled blocks and writes base64; `decodeDrawPixels`
 * reads it back.
 *
 * Scenarios:
 *
 * 1. A 1 by 2 target with the bottom row first is written top row first and
 *    decodes to the same pixels.
 * 2. A 2 by 2 target of opaque red under factor 2 is one opaque red pixel.
 * 3. Half-covered black over a transparent block keeps its straight colour:
 *    two pixels of associated (0, 0, 0, 255) and two empty give alpha 128.
 * 4. A byte count that does not match the size, a factor that does not divide
 *    it, a decoded size that is not the asked one and a wrong byte count are
 *    refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Flips framebuffer rows, downsamples supersampled pixels and validates the encoded and decoded raster.
 * @evidence contracts/development/testing.md#behavioral-verification Calls pixel encoding and decoding with explicit one- and two-pixel rows, opaque and partially covered blocks, and separate invalid inputs.
 * @evidence contracts/development/testing.md#independent-expectations Literal RGBA bytes pin row order, averaged color and coverage alpha 128. The invalid byte count, factor and size each identify a distinct refusal.
 */
export function test_render_draw_draw_pixels(): void {
  const flipped: string = AutoMovieRenderDraw.encodeAutoMovieDrawPixels(
    Uint8Array.from([1, 2, 3, 255, 4, 5, 6, 255]),
    1,
    2,
    1,
  );
  const decoded = AutoMovieRenderDraw.decodeAutoMovieDrawPixels(
    { pixels: flipped, width: 1, height: 2 },
    { width: 1, height: 2 },
  );
  TestValidator.equals("flipped", [...decoded.pixels], [4, 5, 6, 255, 1, 2, 3, 255]);

  const red: Uint8Array = Uint8Array.from(
    new Array<number>(4).fill(0).flatMap((): number[] => [255, 0, 0, 255]),
  );
  TestValidator.equals(
    "averaged",
    [
      ...AutoMovieRenderDraw.decodeAutoMovieDrawPixels(
        { pixels: AutoMovieRenderDraw.encodeAutoMovieDrawPixels(red, 2, 2, 2), width: 1, height: 1 },
        { width: 1, height: 1 },
      ).pixels,
    ],
    [255, 0, 0, 255],
  );
  const half: Uint8Array = Uint8Array.from([
    0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);
  TestValidator.equals(
    "partial coverage",
    [
      ...AutoMovieRenderDraw.decodeAutoMovieDrawPixels(
        { pixels: AutoMovieRenderDraw.encodeAutoMovieDrawPixels(half, 2, 2, 2), width: 1, height: 1 },
        { width: 1, height: 1 },
      ).pixels,
    ],
    [0, 0, 0, 128],
  );

  TestValidator.error("byte count", (): void => {
    AutoMovieRenderDraw.encodeAutoMovieDrawPixels(new Uint8Array(3), 1, 1, 1);
  });
  TestValidator.error("factor", (): void => {
    AutoMovieRenderDraw.encodeAutoMovieDrawPixels(new Uint8Array(12), 3, 1, 2);
  });
  TestValidator.error("size", (): void => {
    AutoMovieRenderDraw.decodeAutoMovieDrawPixels(
      { pixels: flipped, width: 1, height: 2 },
      { width: 2, height: 2 },
    );
  });
  TestValidator.error("decoded bytes", (): void => {
    AutoMovieRenderDraw.decodeAutoMovieDrawPixels(
      { pixels: btoa("abc"), width: 1, height: 1 },
      { width: 1, height: 1 },
    );
  });
}