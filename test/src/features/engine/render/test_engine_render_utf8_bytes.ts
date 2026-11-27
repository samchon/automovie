import { AutoMovieEnginePicture } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `utf8Bytes` encodes text as UTF-8, a lone surrogate becoming U+FFFD.
 *
 * Scenarios:
 *
 * 1. One to four byte sequences: "A", U+00E9, U+20AC and U+1F600.
 * 2. A lone high surrogate is EF BF BD.
 */
export function test_engine_render_utf8_bytes(): void {
  TestValidator.equals(
    "one to four bytes",
    [
      AutoMovieEnginePicture.utf8Bytes("A"),
      AutoMovieEnginePicture.utf8Bytes("\u00e9"),
      AutoMovieEnginePicture.utf8Bytes("\u20ac"),
      AutoMovieEnginePicture.utf8Bytes("\u{1f600}"),
    ],
    [[0x41], [0xc3, 0xa9], [0xe2, 0x82, 0xac], [0xf0, 0x9f, 0x98, 0x80]],
  );
  TestValidator.equals(
    "a lone surrogate",
    AutoMovieEnginePicture.utf8Bytes("\ud800"),
    [0xef, 0xbf, 0xbd],
  );
}
