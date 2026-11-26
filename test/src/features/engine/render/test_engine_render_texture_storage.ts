import { AutoMovieEngineRenderTexture } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `measureAutoMovieTextureStorage` is the bytes of a texture, with its mip
 * chain when mipmapped, or null when the size is unrepresentable.
 *
 * Scenarios:
 *
 * 1. 4 x 4 at 4 bytes a texel is 64 bytes.
 * 2. Mipmapped, the chain 4 x 4, 2 x 2, 1 x 1 adds 16 + 4: 84 bytes.
 * 3. Mipmapped 4 x 1 is 4, then 2 x 1, then 1 x 1 texels: 7 texels, 28 bytes.
 * 4. A zero width, an unknown or zero bytes per texel, and a size past the safe
 *    integers (2^30 x 2^30 at 16 bytes) give null.
 */
export function test_engine_render_texture_storage(): void {
  TestValidator.equals(
    "a plain texture and its chain",
    [
      AutoMovieEngineRenderTexture.measureAutoMovieTextureStorage({
        width: 4,
        height: 4,
        bytesPerTexel: 4,
        mipmapped: false,
      }),
      AutoMovieEngineRenderTexture.measureAutoMovieTextureStorage({
        width: 4,
        height: 4,
        bytesPerTexel: 4,
        mipmapped: true,
      }),
      AutoMovieEngineRenderTexture.measureAutoMovieTextureStorage({
        width: 4,
        height: 1,
        bytesPerTexel: 4,
        mipmapped: true,
      }),
    ],
    [64, 84, 28],
  );
  TestValidator.equals(
    "unrepresentable sizes",
    [
      AutoMovieEngineRenderTexture.measureAutoMovieTextureStorage({
        width: 0,
        height: 4,
        bytesPerTexel: 4,
        mipmapped: false,
      }),
      AutoMovieEngineRenderTexture.measureAutoMovieTextureStorage({
        width: 4,
        height: 4,
        bytesPerTexel: null,
        mipmapped: false,
      }),
      AutoMovieEngineRenderTexture.measureAutoMovieTextureStorage({
        width: 4,
        height: 4,
        bytesPerTexel: 0,
        mipmapped: false,
      }),
      AutoMovieEngineRenderTexture.measureAutoMovieTextureStorage({
        width: 2 ** 30,
        height: 2 ** 30,
        bytesPerTexel: 16,
        mipmapped: false,
      }),
    ],
    [null, null, null, null],
  );
}
