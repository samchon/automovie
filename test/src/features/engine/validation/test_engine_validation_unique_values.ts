import { AutoMovieEngineViolationCollector, AutoMovieEngineValidation } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `validateUniqueValues` pushes one finding per repeated value at the repeat's own
 * path.
 *
 * Scenarios:
 *
 * 1. Distinct values push nothing.
 * 2. Values p, q, p, p push findings at the third and fourth paths.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers distinct values and independent path findings for every repeat.
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateUniqueValues with typed value/path pairs and reads the collector after distinct and repeated sets.
 * @evidence contracts/development/testing.md#independent-expectations In p, q, p, p the latter two p entries repeat the first. Their supplied paths are $.2 and $.3 and q is unique.
 */
export function test_engine_validation_unique_values(): void {
  const clean: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  AutoMovieEngineValidation.validateUniqueValues(
    [
      ["p", "$.0"],
      ["q", "$.1"],
    ],
    "name",
    clean,
  );
  TestValidator.equals("distinct", clean.items.length, 0);

  const found: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  AutoMovieEngineValidation.validateUniqueValues(
    [
      ["p", "$.0"],
      ["q", "$.1"],
      ["p", "$.2"],
      ["p", "$.3"],
    ],
    "name",
    found,
  );
  TestValidator.equals(
    "paths",
    found.items.map((row: { path: string }): string => row.path),
    ["$.2", "$.3"],
  );
}
