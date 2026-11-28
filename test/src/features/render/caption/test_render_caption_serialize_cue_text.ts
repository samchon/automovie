import { AutoMovieRenderCaption } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderCaption.serializeWebVttCueText` canonicalizes breaks, escapes each line and
 * writes an empty line as an empty class span, so a blank line cannot end the
 * cue.
 *
 * Scenarios:
 *
 * 1. "a < b\r\nc" reads "a &lt; b\nc".
 * 2. "a\n\nb" reads "a\n<c></c>\nb".
 *
 * @evidence contracts/development/common.md#meaningful-documentation Escapes cue text, normalizes line endings and keeps a blank display line within its cue.
 * @evidence contracts/development/testing.md#behavioral-verification Calls cue serialization with markup and CRLF, and with an internal blank line.
 * @evidence contracts/development/testing.md#independent-expectations The exact strings require an escaped less-than character and an empty class span in the correct line, independently of the serializer.
 */
export function test_render_caption_serialize_cue_text(): void {
  TestValidator.equals(
    "escaped lines",
    AutoMovieRenderCaption.serializeWebVttCueText("a < b\r\nc"),
    "a &lt; b\nc",
  );
  TestValidator.equals(
    "a blank line",
    AutoMovieRenderCaption.serializeWebVttCueText("a\n\nb"),
    "a\n<c></c>\nb",
  );
}
