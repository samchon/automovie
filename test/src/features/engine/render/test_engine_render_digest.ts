import { AutoMovieEngineRenderTarget } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `renderDigest` is the `sha256:` digest of the UTF-8 text.
 *
 * Scenarios with fixed SHA-256 reference digests:
 *
 * 1. The empty string is e3b0c442 98fc1c14 9afbf4c8 996fb924 27ae41e4 649b934c
 *    a495991b 7852b855.
 * 2. "abc" is ba7816bf 8f01cfea 414140de 5dae2223 b00361a3 96177a9c b410ff61
 *    f20015ad.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names SHA-256, text input and the empty and abc vector cases.
 * @evidence contracts/development/testing.md#behavioral-verification Passes both strings directly to RenderTarget.autoMovieRenderDigest and compares the prefixed text results.
 * @evidence contracts/development/testing.md#independent-expectations The literal 256-bit standard SHA-256 vectors for empty input and abc, with the public prefix, supply independent expected strings.
 */
export function test_engine_render_digest(): void {
  TestValidator.equals(
    "FIPS vectors",
    [AutoMovieEngineRenderTarget.autoMovieRenderDigest(""), AutoMovieEngineRenderTarget.autoMovieRenderDigest("abc")],
    [
      "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    ],
  );
}
