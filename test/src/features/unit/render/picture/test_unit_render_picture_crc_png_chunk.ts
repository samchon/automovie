import { crcAutoMoviePngChunk } from "@automovie/render/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `crcAutoMoviePngChunk` is the CRC-32 of PNG chunk bytes.
 *
 * Scenarios:
 *
 * 1. The ASCII text `123456789` has the standard check value 0xCBF43926.
 * 2. No bytes give 0.
 */
export function test_unit_render_picture_crc_png_chunk(): void {
  TestValidator.equals(
    "check value",
    crcAutoMoviePngChunk(new TextEncoder().encode("123456789")),
    0xcbf43926,
  );
  TestValidator.equals("empty", crcAutoMoviePngChunk(new Uint8Array(0)), 0);
}