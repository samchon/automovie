import { validateUniqueIds } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * alidateUniqueIds reports a repeated record id at <path>[index].id of the
 * later record.
 *
 * Scenarios:
 *
 * 1. Ids x, y, x report one row at items[2].id naming the label and the id.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateUniqueIds on a list with one repeat and asserts the single row path, kind and value.
 * @evidence contracts/development/testing.md#independent-expectations The path format is the stated contract and index 2 is the third record, so the expected path is derived from the input position.
 * @evidence contracts/development/testing.md#distinguishing-cases Only the repeat case is run; the all-distinct case is owned by test_unit_engine_validation_unique_by.
 * @evidence contracts/development/testing.md#execution-ownership The named test_unit_engine_validation_unique_ids entry runs portable in-memory literals with no host and no dynamically registered cases.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_unit_engine_validation_unique_ids(): void {
  const found: IAutoMovieConstraintViolation[] = [];
  validateUniqueIds(
    [{ id: "x" }, { id: "y" }, { id: "x" }],
    "items",
    "node",
    found,
  );
  TestValidator.equals("count", found.length, 1);
  TestValidator.equals("path", found[0]!.path, "items[2].id");
  TestValidator.equals("kind", found[0]!.kind, "type");
  TestValidator.equals("value", found[0]!.value, "x");
}
