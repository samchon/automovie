import { autoMovieCaptionLanguageComparisonKey } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `autoMovieCaptionLanguageComparisonKey` is the parsed tag's comparison key,
 * or null for a malformed tag.
 *
 * Scenarios:
 *
 * 1. "en-US" and "EN-us" share the lower-cased key "en-us".
 * 2. "not a tag" has none.
 */
export function test_render_caption_language_comparison_key(): void {
  TestValidator.equals(
    "case-insensitive",
    [
      autoMovieCaptionLanguageComparisonKey("en-US"),
      autoMovieCaptionLanguageComparisonKey("EN-us"),
    ],
    ["en-us", "en-us"],
  );
  TestValidator.equals(
    "malformed",
    autoMovieCaptionLanguageComparisonKey("not a tag"),
    null,
  );
}
