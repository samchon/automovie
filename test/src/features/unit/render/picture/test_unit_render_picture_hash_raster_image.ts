import { hashAutoMovieRasterImage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

/**
 * `hashAutoMovieRasterImage` is the SHA-256 of the size and the RGB bytes.
 *
 * Scenarios:
 *
 * 1. A 1 by 1 image is the digest of big-endian width, big-endian height and
 *    its three colour bytes.
 * 2. Alpha is not hashed.
 * 3. A pixel buffer that does not match the size is refused.
 */
export function test_unit_render_picture_hash_raster_image(): void {
  const expected: string = `sha256:${createHash("sha256")
    .update(Uint8Array.from([0, 0, 0, 1, 0, 0, 0, 1, 1, 2, 3]))
    .digest("hex")}`;
  TestValidator.equals(
    "digest",
    hashAutoMovieRasterImage({
      width: 1,
      height: 1,
      pixels: Uint8ClampedArray.from([1, 2, 3, 255]),
    }),
    expected,
  );
  TestValidator.equals(
    "alpha ignored",
    hashAutoMovieRasterImage({
      width: 1,
      height: 1,
      pixels: Uint8ClampedArray.from([1, 2, 3, 7]),
    }),
    expected,
  );
  TestValidator.error("mismatched buffer", (): void => {
    hashAutoMovieRasterImage({
      width: 2,
      height: 1,
      pixels: Uint8ClampedArray.from([1, 2, 3, 255]),
    });
  });
}