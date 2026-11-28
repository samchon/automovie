import { AutoMovieRenderCaption } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderCaption.languageComparisonKey` is the parsed tag's comparison key,
 * or null for a malformed tag.
 *
 * Scenarios:
 *
 * 1. "en-US" and "EN-us" share the lower-cased key "en-us".
 * 2. "not a tag" has none.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives mixed-case language tags the same lowercase comparison key and refuses malformed text.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the comparison-key reader on two spellings of the same tag and on a malformed one.
 * @evidence contracts/development/testing.md#independent-expectations The literal key en-us in both cases pins ASCII case matching, and the malformed input must return null.
 */
export function test_render_caption_language_comparison_key(): void {
  TestValidator.equals(
    "case-insensitive",
    [
      AutoMovieRenderCaption.languageComparisonKey("en-US"),
      AutoMovieRenderCaption.languageComparisonKey("EN-us"),
    ],
    ["en-us", "en-us"],
  );
  TestValidator.equals(
    "malformed",
    AutoMovieRenderCaption.languageComparisonKey("not a tag"),
    null,
  );
}
