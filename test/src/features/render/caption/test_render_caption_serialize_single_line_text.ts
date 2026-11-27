import { AutoMovieRenderCaption } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderCaption.serializeWebVttSingleLineText` turns every control, line breaks
 * included, into a space and escapes "&", "<" and ">".
 *
 * Scenarios:
 *
 * 1. "a\nb\tc" reads "a b c".
 * 2. "<b>&</b>" reads "<b>&</b>".
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
