import { AutoMovieRenderCaption } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderCaption.canonicalizeText` turns CRLF and CR breaks into LF and each
 * prohibited control character into one space, keeping tab and LF.
 *
 * Scenarios:
 *
 * 1. "a\r\nb\rc" reads "a\nb\nc".
 * 2. "a\u0000b\u007fc" reads "a b c"; "a\tb" is kept.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Canonicalizes carriage-return line breaks and prohibited controls while preserving tabs.
 * @evidence contracts/development/testing.md#behavioral-verification Calls text normalization with mixed CRLF and CR, two prohibited controls, and an ordinary tab.
 * @evidence contracts/development/testing.md#independent-expectations The exact LF output and one space per prohibited character identify normalization without deleting controls or tabs.
 */
export function test_render_caption_canonicalize_text(): void {
  TestValidator.equals(
    "line breaks",
    AutoMovieRenderCaption.canonicalizeText("a\r\nb\rc"),
    "a\nb\nc",
  );
  TestValidator.equals(
    "controls",
    AutoMovieRenderCaption.canonicalizeText("a\u0000b\u007fc"),
    "a b c",
  );
  TestValidator.equals(
    "a tab",
    AutoMovieRenderCaption.canonicalizeText("a\tb"),
    "a\tb",
  );
}
