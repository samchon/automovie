import { AutoMovieEngineRenderTarget } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `renderHash32` is the 32-bit FNV-1a hash of the UTF-8 bytes (offset
 * 0x811c9dc5, prime 0x01000193).
 *
 * Scenarios, from the published FNV test vectors:
 *
 * 1. The empty string is the offset basis 0x811c9dc5.
 * 2. "a" is 0xe40c292c.
 * 3. "foobar" is 0xbf9cf968.
 */
export function test_engine_render_hash32(): void {
  TestValidator.equals(
    "FNV-1a vectors",
    [
      AutoMovieEngineRenderTarget.autoMovieRenderHash32(""),
      AutoMovieEngineRenderTarget.autoMovieRenderHash32("a"),
      AutoMovieEngineRenderTarget.autoMovieRenderHash32("foobar"),
    ],
    [0x811c9dc5, 0xe40c292c, 0xbf9cf968],
  );
}
