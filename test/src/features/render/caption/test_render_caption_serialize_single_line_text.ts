import { AutoMovieRenderCaption } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderCaption.serializeWebVttSingleLineText` turns every control, line breaks
 * included, into a space and escapes "&", "<" and ">".
 *
 * Scenarios:
 *
 * 1. "a\nb\tc" reads "a b c".
 * 2. "<b>&</b>" reads "&lt;b&gt;&amp;&lt;/b&gt;".
 *
 * @evidence contracts/development/common.md#meaningful-documentation Flattens controls to spaces and escapes WebVTT markup in single-line text.
 * @evidence contracts/development/testing.md#behavioral-verification Calls single-line serialization with newline and tab inputs and a separate markup string.
 * @evidence contracts/development/testing.md#independent-expectations The literal outputs pin both the three words separated by spaces and the three escaped markup characters.
 */
export function test_render_caption_serialize_single_line_text(): void {
  TestValidator.equals(
    "controls",
    AutoMovieRenderCaption.serializeWebVttSingleLineText("a\nb\tc"),
    "a b c",
  );
  TestValidator.equals(
    "markup",
    AutoMovieRenderCaption.serializeWebVttSingleLineText("<b>&</b>"),
    "&lt;b&gt;&amp;&lt;/b&gt;",
  );
}
