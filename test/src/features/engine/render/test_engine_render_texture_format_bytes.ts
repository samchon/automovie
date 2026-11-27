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
