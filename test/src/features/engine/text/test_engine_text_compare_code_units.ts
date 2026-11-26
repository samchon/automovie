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
