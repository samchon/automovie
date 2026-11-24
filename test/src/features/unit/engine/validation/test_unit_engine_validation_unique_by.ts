import { validateUniqueBy } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * alidateUniqueBy reports each later occurrence of an id at that entry's own
 * path and never the first.
 *
 * Scenarios:
 *
 * 1. Distinct ids report nothing.
 * 2. The ids a, b, a, a report the second and third a at their paths, in order.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateUniqueBy with distinct and repeated ids and asserts the reported paths.
 * @evidence contracts/development/testing.md#independent-expectations By the uniqueness contract the first occurrence is valid and each later one is a fault, so the expected paths are read off the input order.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinct versus repeated ids are adjacent; the empty list is covered by the first scenario with zero rows.
 * @evidence contracts/development/testing.md#execution-ownership The named test_unit_engine_validation_unique_by entry runs portable in-memory literals with no host and no dynamically registered cases.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_unit_engine_validation_unique_by(): void {
  const clean: IAutoMovieConstraintViolation[] = [];
  validateUniqueBy(
    [
      { id: "a", path: "$.0" },
      { id: "b", path: "$.1" },
    ],
    "id",
    clean,
  );
  TestValidator.equals("distinct", clean.length, 0);

  const found: IAutoMovieConstraintViolation[] = [];
  validateUniqueBy(
    [
      { id: "a", path: "$.0" },
      { id: "b", path: "$.1" },
      { id: "a", path: "$.2" },
      { id: "a", path: "$.3" },
    ],
    "id",
    found,
  );
  TestValidator.equals(
    "paths",
    found.map((row: IAutoMovieConstraintViolation): string => row.path),
    ["$.2", "$.3"],
  );
}
