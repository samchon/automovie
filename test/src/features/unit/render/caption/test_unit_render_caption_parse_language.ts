import { parseAutoMovieCaptionLanguage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `parseAutoMovieCaptionLanguage` admits RFC 5646 well-formed language tags
 * (§2.1 `langtag`, `privateuse` and `grandfathered`), keeps the spelling for
 * display and keys them by their ASCII lower-case form. Every expected key is
 * read from the grammar, not from the parser.
 *
 * Scenarios:
 *
 * 1. "EN-Us" displays as written and keys as "en-us".
 * 2. Grandfathered "ART-Lojban" and "I-Klingon" are admitted; "art-lojbar"
 *    is an ordinary language and variant.
 * 3. Subtags: "en--US", "en-abcdefghi", "en_US" and "en-" are refused.
 * 4. Primary language: "de" and "abcdefgh" pass; "e" and "1en" do not.
 * 5. Extlang, script, region: "zh-yue-Hant-HK", "zh-abc-def-ghi", "es-419"
 *    and "sr-Latn" pass; a fourth extlang "zh-abc-def-ghi-jkl" does not.
 * 6. Variants: "sl-rozaj-biske" and "de-DE-1901" pass; a repeat
 *    "de-DE-1901-1901" and four letters "de-DE-abcd-x-priv" do not.
 * 7. Extensions: "en-u-co-phonebk" and "en-a-bbb-u-co-phonebk" pass; a bare
 *    "en-u" and a repeat "en-u-aaa-u-bbb" do not.
 * 8. Private use: "x-movie" and "en-US-x-movie-01" pass; "x" and "en-US-x" do
 *    not; "en-US-999999" is a variant and "en-US-abc" and "en-12" place no
 *    subtag.
 */
export function test_unit_render_caption_parse_language(): void {
  TestValidator.equals("display and key", parseAutoMovieCaptionLanguage("EN-Us"), {
    display: "EN-Us",
    comparisonKey: "en-us",
  });
  const cases: [string, string | null][] = [
    ["ART-Lojban", "art-lojban"],
    ["I-Klingon", "i-klingon"],
    ["art-lojbar", "art-lojbar"],
    ["en--US", null],
    ["en-abcdefghi", null],
    ["en_US", null],
    ["en-", null],
    ["de", "de"],
    ["abcdefgh", "abcdefgh"],
    ["e", null],
    ["1en", null],
    ["zh-yue-Hant-HK", "zh-yue-hant-hk"],
    ["zh-abc-def-ghi", "zh-abc-def-ghi"],
    ["zh-abc-def-ghi-jkl", null],
    ["es-419", "es-419"],
    ["sr-Latn", "sr-latn"],
    ["sl-rozaj-biske", "sl-rozaj-biske"],
    ["de-DE-1901", "de-de-1901"],
    ["de-DE-1901-1901", null],
    ["de-DE-abcd-x-priv", null],
    ["en-u-co-phonebk", "en-u-co-phonebk"],
    ["en-a-bbb-u-co-phonebk", "en-a-bbb-u-co-phonebk"],
    ["en-u", null],
    ["en-u-aaa-u-bbb", null],
    ["x-movie", "x-movie"],
    ["en-US-x-movie-01", "en-us-x-movie-01"],
    ["x", null],
    ["en-US-x", null],
    ["en-US-999999", "en-us-999999"],
    ["en-US-abc", null],
    ["en-12", null],
  ];
  for (const [tag, key] of cases)
    TestValidator.equals(
      tag,
      parseAutoMovieCaptionLanguage(tag)?.comparisonKey ?? null,
      key,
    );
}