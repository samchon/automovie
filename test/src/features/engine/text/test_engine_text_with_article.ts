import { AutoMovieEngineText } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `withArticle` prefixes "an" before a subject whose first written letter is a
 * vowel letter (a, e, i, o, u, either case) and "a" otherwise, keeping the
 * subject as written.
 *
 * Scenarios:
 *
 * 1. "area" and "opening" take "an"; "spot", "point" and "door" take "a".
 * 2. An upper-case vowel, "Ice", takes "an" and keeps its case.
 * 3. The empty subject takes "a".
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines written first-letter selection of the indefinite article and unchanged subject case.
 * @evidence contracts/development/testing.md#behavioral-verification Prefixes several vowel and consonant subjects, an uppercase vowel and an empty subject.
 * @evidence contracts/development/testing.md#independent-expectations Known initial letters determine `an` or `a`, uppercase `Ice` retains its case and the empty fixture follows the default `a` rule.
 */
export function test_engine_text_with_article(): void {
  // 1. Vowel- and consonant-initial subjects.
  for (const [subject, expected] of [
    ["area", "an area"],
    ["opening", "an opening"],
    ["spot", "a spot"],
    ["point", "a point"],
    ["door", "a door"],
  ] as const)
    TestValidator.equals(
      subject,
      AutoMovieEngineText.withArticle(subject),
      expected,
    );

  // 2. Case is ignored for the letter and kept in the subject.
  TestValidator.equals(
    "an upper-case vowel",
    AutoMovieEngineText.withArticle("Ice"),
    "an Ice",
  );

  // 3. The empty subject.
  TestValidator.equals(
    "the empty subject",
    AutoMovieEngineText.withArticle(""),
    "a ",
  );
}
