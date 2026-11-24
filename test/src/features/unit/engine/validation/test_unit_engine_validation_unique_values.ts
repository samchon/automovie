import { ViolationCollector, validateUniqueValues } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * alidateUniqueValues pushes one finding per repeated value at the repeat's own
 * path.
 *
 * Scenarios:
 *
 * 1. Distinct values push nothing.
 * 2. Values p, q, p, p push findings at the third and fourth paths.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateUniqueValues with distinct and repeated values and asserts the collected paths.
 * @evidence contracts/development/testing.md#independent-expectations The first occurrence is valid by the uniqueness contract, so the expected paths are the later occurrences read off the input.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinct versus repeated are adjacent cases; message wording is not asserted.
 * @evidence contracts/development/testing.md#execution-ownership The named test_unit_engine_validation_unique_values entry runs portable in-memory literals with no host and no dynamically registered cases.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_unit_engine_validation_unique_values(): void {
  const clean: ViolationCollector = new ViolationCollector();
  validateUniqueValues(
    [
      ["p", "$.0"],
      ["q", "$.1"],
    ],
    "name",
    clean,
  );
  TestValidator.equals("distinct", clean.items.length, 0);

  const found: ViolationCollector = new ViolationCollector();
  validateUniqueValues(
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
