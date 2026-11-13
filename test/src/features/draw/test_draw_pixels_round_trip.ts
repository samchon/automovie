import {
  type IAutoMovieRasterImage,
  decodeAutoMovieDrawPixels,
  encodeAutoMovieDrawPixels,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * A picture read back from WebGL, rows from the bottom, comes out of the page as base64 and back into a raster of the stated size with rows from the top, and a supersampled picture is reduced by averaging each block.
 *
 * Scenarios:
 *
 * 1. A 3 by 2 target whose bottom row is red and top row blue decodes to a 3 by 2 raster whose first row is blue and second red, each pixel's column kept.
 * 2. A 4 by 2 target at factor 2 reduces to 2 by 1, each pixel the rounded mean of its 2 by 2 block: values 0, 10, 20, 31 average to 15 (15.25) and 100, 100, 101, 101 to 101 (100.5 rounds up).
 * 3. Decoding refuses a picture whose stated size is not the asked raster, and bytes that are not the stated size's.
 * 4. Encoding refuses a byte count that is not the target's and a factor that does not divide it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the page's encoder and the host's decoder on hand-made buffers and reads the raster; a missing flip, a shifted column, a wrong average or a silently cropped picture fails.
 * @evidence contracts/development/testing.md#independent-expectations WebGL's `readPixels` writes rows from the bottom of the framebuffer, so the expected first row is the buffer's last; the averages are computed by hand from the block values, including a half that rounds up under `Math.round`.
 * @evidence contracts/development/testing.md#distinguishing-cases Factor 1 against factor 2, a size match against a size and a length mismatch, and a factor that does not divide the width. How a cell becomes a call is owned by `test_draw_cell_call`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_pixels_round_trip`; buffers are in memory and no WebGL context exists.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_pixels_round_trip(): void {
  // 1. Rows from the bottom become rows from the top.
  const bottomUp: Uint8Array = new Uint8Array(3 * 2 * 4);
  for (let column: number = 0; column < 3; column++) {
    bottomUp.set([200, column, 0, 255], (0 * 3 + column) * 4);
    bottomUp.set([0, column, 200, 255], (1 * 3 + column) * 4);
  }
  const raster: IAutoMovieRasterImage = decodeAutoMovieDrawPixels(
    {
      pixels: encodeAutoMovieDrawPixels(bottomUp, 3, 2, 1),
      width: 3,
      height: 2,
    },
    { width: 3, height: 2 },
  );
  TestValidator.equals(
    "the size is kept",
    [raster.width, raster.height],
    [3, 2],
  );
  TestValidator.equals(
    "the top row is the blue row read last",
    Array.from(raster.pixels),
    [
      0, 0, 200, 255, 0, 1, 200, 255, 0, 2, 200, 255, 200, 0, 0, 255, 200, 1, 0,
      255, 200, 2, 0, 255,
    ],
  );

  // 2. A supersampled target averaged by blocks.
  const large: Uint8Array = new Uint8Array(4 * 2 * 4);
  const values: number[][] = [
    [0, 10, 100, 100],
    [20, 31, 101, 101],
  ];
  for (let row: number = 0; row < 2; row++)
    for (let column: number = 0; column < 4; column++)
      large.set([values[row]![column]!, 0, 0, 255], (row * 4 + column) * 4);
  const reduced: IAutoMovieRasterImage = decodeAutoMovieDrawPixels(
    { pixels: encodeAutoMovieDrawPixels(large, 4, 2, 2), width: 2, height: 1 },
    { width: 2, height: 1 },
  );
  TestValidator.equals(
    "each block is its mean",
    Array.from(reduced.pixels),
    [15, 0, 0, 255, 101, 0, 0, 255],
  );

  // 3. Decoding refusals.
  const text: string = encodeAutoMovieDrawPixels(bottomUp, 3, 2, 1);
  TestValidator.predicate(
    "another size than asked",
    throwsError(
      (): unknown =>
        decodeAutoMovieDrawPixels(
          { pixels: text, width: 3, height: 2 },
          { width: 2, height: 3 },
        ),
      "3x2",
    ),
  );
  TestValidator.predicate(
    "bytes of another size",
    throwsError(
      (): unknown =>
        decodeAutoMovieDrawPixels(
          { pixels: text, width: 2, height: 2 },
          { width: 2, height: 2 },
        ),
      "24 bytes",
    ),
  );

  // 4. Encoding refusals.
  TestValidator.predicate(
    "a short buffer",
    throwsError(
      (): unknown => encodeAutoMovieDrawPixels(new Uint8Array(7), 3, 2, 1),
      "7 bytes",
    ),
  );
  TestValidator.predicate(
    "a factor that does not divide",
    throwsError(
      (): unknown => encodeAutoMovieDrawPixels(bottomUp, 3, 2, 2),
      "factor 2",
    ),
  );
}
