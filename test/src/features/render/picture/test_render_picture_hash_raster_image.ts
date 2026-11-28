import { AutoMovieRenderPicture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

/**
 * `AutoMovieRenderPicture.hashRasterImage` is the SHA-256 of the size and the
 * RGB bytes.
 *
 * Scenarios:
 *
 * 1. A 1 by 1 image is the digest of big-endian width, big-endian height and its
 *    three colour bytes.
 * 2. Alpha is not hashed.
 * 3. A pixel buffer that does not match the size is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Hashes the raster dimensions and RGB bytes, preserving identity across alpha-only changes.
 * @evidence contracts/development/testing.md#behavioral-verification Calls raster hashing on a one-pixel image, then changes its alpha and supplies a mismatched buffer.
 * @evidence contracts/development/testing.md#independent-expectations The independent big-endian size bytes and RGB values form the SHA-256 input. The second alpha value must leave that digest identical.
 */
export function test_render_picture_hash_raster_image(): void {
  const expected: string = `sha256:${createHash("sha256")
    .update(Uint8Array.from([0, 0, 0, 1, 0, 0, 0, 1, 1, 2, 3]))
    .digest("hex")}`;
  TestValidator.equals(
    "digest",
    AutoMovieRenderPicture.hashRasterImage({
      width: 1,
      height: 1,
      pixels: Uint8ClampedArray.from([1, 2, 3, 255]),
    }),
    expected,
  );
  TestValidator.equals(
    "alpha ignored",
    AutoMovieRenderPicture.hashRasterImage({
      width: 1,
      height: 1,
      pixels: Uint8ClampedArray.from([1, 2, 3, 7]),
    }),
    expected,
  );
  TestValidator.error("mismatched buffer", (): void => {
    AutoMovieRenderPicture.hashRasterImage({
      width: 2,
      height: 1,
      pixels: Uint8ClampedArray.from([1, 2, 3, 255]),
    });
  });
}
