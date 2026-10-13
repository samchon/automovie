import { measureAutoMovieTextureStorage } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * Uncompressed texture bounds count actual integer mip extents and refuse an
 * absent representation or unsafe arithmetic instead of claiming zero bytes.
 *
 * Scenarios:
 *
 * 1. RGBA8, half and float 4-by-4 base levels cost 64, 128 and 256 bytes.
 * 2. A 4-by-4 chain has 16+4+1 texels; a 3-by-5 chain has 15+2+1;
 *    a 1-by-8 chain has 8+4+2+1, including its clamped narrow axis.
 * 3. Zero, fractional and nonfinite dimensions or texel widths refuse, as do
 *    unknown formats and overflow; a one-texel chain ends at its base level.
 */
export const test_render_texture_storage = (): void => {
  for (const [bytesPerTexel, expected] of [[4, 64], [8, 128], [16, 256]])
    TestValidator.equals("base representation", measureAutoMovieTextureStorage({ width: 4, height: 4, bytesPerTexel, mipmapped: false }), expected);
  TestValidator.equals("square mip chain", measureAutoMovieTextureStorage({ width: 4, height: 4, bytesPerTexel: 4, mipmapped: true }), (16 + 4 + 1) * 4);
  TestValidator.equals("non-power-of-two chain", measureAutoMovieTextureStorage({ width: 3, height: 5, bytesPerTexel: 4, mipmapped: true }), (15 + 2 + 1) * 4);
  TestValidator.equals("narrow chain", measureAutoMovieTextureStorage({ width: 1, height: 8, bytesPerTexel: 8, mipmapped: true }), (8 + 4 + 2 + 1) * 8);
  TestValidator.equals("single texel", measureAutoMovieTextureStorage({ width: 1, height: 1, bytesPerTexel: 16, mipmapped: true }), 16);
  for (const value of [0, -1, 1.5, NaN, Infinity]) {
    for (const field of ["width", "height", "bytesPerTexel"])
      TestValidator.equals("invalid storage fact", measureAutoMovieTextureStorage({ width: 4, height: 4, bytesPerTexel: 4, mipmapped: false, [field]: value }), null);
  }
  TestValidator.equals("unknown representation", measureAutoMovieTextureStorage({ width: 4, height: 4, bytesPerTexel: null, mipmapped: false }), null);
  TestValidator.equals("overflow", measureAutoMovieTextureStorage({ width: Number.MAX_SAFE_INTEGER, height: 2, bytesPerTexel: 16, mipmapped: false }), null);
};
