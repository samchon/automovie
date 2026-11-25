import { serializeAutoMovieWebVttCueText } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `serializeAutoMovieWebVttCueText` canonicalizes breaks, escapes each line and
 * writes an empty line as an empty class span, so a blank line cannot end the
 * cue.
 *
 * Scenarios:
 *
 * 1. "a < b\r\nc" reads "a < b\nc".
 * 2. "a\n\nb" reads "a\n<c></c>\nb".
 */
export function test_render_caption_serialize_cue_text(): void {
  TestValidator.equals(
    "escaped lines",
    serializeAutoMovieWebVttCueText("a < b\r\nc"),
    "a &lt; b\nc",
  );
  TestValidator.equals(
    "a blank line",
    serializeAutoMovieWebVttCueText("a\n\nb"),
    "a\n<c></c>\nb",
  );
}
