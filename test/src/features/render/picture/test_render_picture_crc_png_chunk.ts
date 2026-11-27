import {
  crcPngChunk
} from "../../../../../packages/render/src/picture/internal/crcPngChunk";
import { TestValidator } from "@nestia/e2e";

/**
 * `crcPngChunk` is the CRC-32 of PNG chunk bytes.
 *
 * Scenarios:
 *
 * 1. The ASCII text `123456789` has the standard check value 0xCBF43926.
 * 2. No bytes give 0.
 */
export function test_render_picture_crc_png_chunk(): void {
  TestValidator.equals(
    "check value",
    crcPngChunk(new TextEncoder().encode("123456789")),
    0xcbf43926,
  );
  TestValidator.equals("empty", crcPngChunk(new Uint8Array(0)), 0);
}