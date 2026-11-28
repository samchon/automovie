import { AutoMovieEngineRenderTexture } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `textureFormatBytes` is the bytes per texel of a render texture
 * format.
 *
 * Scenarios:
 *
 * 1. R16f is 2 bytes (one half float).
 * 2. Rgba8 and rg16f are 4 bytes.
 * 3. Rgba16f is 8 bytes and rgba32f is 16 bytes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names five formats and their byte counts per texel.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public RenderTexture byte-count operation with each declared format literal.
 * @evidence contracts/development/testing.md#independent-expectations Channel counts multiplied by one byte for an 8-bit channel, two for a half float and four for a full float yield 2, 4, 4, 8 and 16.
 */
export function test_engine_render_texture_format_bytes(): void {
  TestValidator.equals(
    "bytes per texel",
    [
      AutoMovieEngineRenderTexture.autoMovieTextureFormatBytes("r16f"),
      AutoMovieEngineRenderTexture.autoMovieTextureFormatBytes("rgba8"),
      AutoMovieEngineRenderTexture.autoMovieTextureFormatBytes("rg16f"),
      AutoMovieEngineRenderTexture.autoMovieTextureFormatBytes("rgba16f"),
      AutoMovieEngineRenderTexture.autoMovieTextureFormatBytes("rgba32f"),
    ],
    [2, 4, 4, 8, 16],
  );
}
