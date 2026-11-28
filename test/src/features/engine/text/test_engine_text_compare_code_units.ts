import { AutoMovieEngineText } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `compareCodeUnits` orders two strings by UTF-16 code unit, the order of
 * `JSON.stringify` keys under canonical JSON.
 *
 * Scenarios:
 *
 * 1. A lower code unit sorts first: "B" (0x42) before "a" (0x61).
 * 2. A higher code unit sorts last, and equal strings compare as 0.
 * 3. A prefix sorts before its extension.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines UTF-16 code unit ordering, equal values and shorter-prefix precedence.
 * @evidence contracts/development/testing.md#behavioral-verification Compares uppercase and lowercase characters, equal text and a string and its extension.
 * @evidence contracts/development/testing.md#independent-expectations The numeric values 0x42 and 0x61 establish case order; an exact prefix sorts earlier even if all its code units match.
 */
export function test_engine_text_compare_code_units(): void {
  TestValidator.predicate(
    "an uppercase letter precedes a lowercase one",
    AutoMovieEngineText.compareCodeUnits("B", "a") === -1 &&
      AutoMovieEngineText.compareCodeUnits("a", "B") === 1,
  );
  TestValidator.predicate(
    "equal strings compare as zero",
    AutoMovieEngineText.compareCodeUnits("key", "key") === 0,
  );
  TestValidator.predicate(
    "a prefix precedes its extension",
    AutoMovieEngineText.compareCodeUnits("a", "ab") === -1,
  );
}
