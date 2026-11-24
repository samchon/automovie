import { isAutoMovieWebVttIdentifier } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `isAutoMovieWebVttIdentifier` admits a non-empty identifier with no line
 * break and no "-->".
 *
 * Scenarios:
 *
 * 1. "cue-1" is admitted.
 * 2. "", "a\nb", "a\rb" and "a-->b" are refused.
 */
export function test_unit_render_caption_is_web_vtt_identifier(): void {
  TestValidator.predicate("cue-1", isAutoMovieWebVttIdentifier("cue-1"));
  TestValidator.equals(
    "refused",
    ["", "a\nb", "a\rb", "a-->b"].map(isAutoMovieWebVttIdentifier),
    [false, false, false, false],
  );
}
