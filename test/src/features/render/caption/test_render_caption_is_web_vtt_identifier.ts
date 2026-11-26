import { AutoMovieRenderCaption } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderCaption.isWebVttIdentifier` admits a non-empty identifier with no line
 * break and no "-->".
 *
 * Scenarios:
 *
 * 1. "cue-1" is admitted.
 * 2. "", "a\nb", "a\rb" and "a-->b" are refused.
 */
export function test_render_caption_is_web_vtt_identifier(): void {
  TestValidator.predicate("cue-1", AutoMovieRenderCaption.isWebVttIdentifier("cue-1"));
  TestValidator.equals(
    "refused",
    ["", "a\nb", "a\rb", "a-->b"].map(AutoMovieRenderCaption.isWebVttIdentifier),
    [false, false, false, false],
  );
}
