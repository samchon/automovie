import { parseAutoMovieCaptionLanguage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `parseAutoMovieCaptionLanguage` admits RFC 5646 well-formed language tags
 * (§2.1 grammar) and keys them by their lower-case form.
 *
 * Scenarios:
 *
 * 1. "en-US", "zh-Hant-TW", "sl-rozaj-biske" and "x-private" are well formed;
 *    "en-US" keys as "en-us".
 * 2. The grandfathered "i-klingon" is admitted.
 * 3. "e", "en--US", a repeated variant "de-1901-1901", a repeated singleton
 *    "en-a-bbb-a-ccc", a bare "en-x" and "en_US" are not.
 */
export function test_unit_render_caption_parse_language(): void {
  TestValidator.equals(
    "a region tag",
    parseAutoMovieCaptionLanguage("en-US"),
    { display: "en-US", comparisonKey: "en-us" },
  );
  for (const tag of ["zh-Hant-TW", "sl-rozaj-biske", "x-private", "i-klingon"])
    TestValidator.predicate(tag, parseAutoMovieCaptionLanguage(tag) !== null);
  for (const tag of ["e", "en--US", "de-1901-1901", "en-a-bbb-a-ccc", "en-x", "en_US"])
    TestValidator.equals(tag, parseAutoMovieCaptionLanguage(tag), null);
}