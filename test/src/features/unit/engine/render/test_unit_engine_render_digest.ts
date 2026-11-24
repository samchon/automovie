import { autoMovieRenderDigest } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `autoMovieRenderDigest` is the `sha256:` digest of the UTF-8 text.
 *
 * Scenarios, from the FIPS 180-4 examples:
 *
 * 1. The empty string is e3b0c442 98fc1c14 9afbf4c8 996fb924 27ae41e4 649b934c
 *    a495991b 7852b855.
 * 2. "abc" is ba7816bf 8f01cfea 414140de 5dae2223 b00361a3 96177a9c b410ff61
 *    f20015ad.
 */
export function test_unit_engine_render_digest(): void {
  TestValidator.equals(
    "FIPS vectors",
    [autoMovieRenderDigest(""), autoMovieRenderDigest("abc")],
    [
      "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    ],
  );
}
