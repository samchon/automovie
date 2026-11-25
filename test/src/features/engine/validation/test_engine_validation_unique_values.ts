import { ViolationCollector, validateUniqueValues } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * AlidateUniqueValues pushes one finding per repeated value at the repeat's own
 * path.
 *
 * Scenarios:
 *
 * 1. Distinct values push nothing.
 * 2. Values p, q, p, p push findings at the third and fourth paths.
 */
export function test_engine_validation_unique_values(): void {
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
