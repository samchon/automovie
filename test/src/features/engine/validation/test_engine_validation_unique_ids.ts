import {
  validateUniqueIds
} from "../../../../../packages/engine/src/validation/internal/validateUniqueIds";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `validateUniqueIds` reports a repeated record id at the later record's id path.
 *
 * Scenarios:
 *
 * 1. Ids x, y, x report one type finding at `items[2].id` with value x.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers the count, kind, value and field path of one repeated record id.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the validateUniqueIds owner directly with x, y, x and an explicit path and label.
 * @evidence contracts/development/testing.md#independent-expectations Only index two repeats an earlier id. The retained value is x, and the field is its own items[2].id rather than either of the preceding records.
 */
export function test_engine_validation_unique_ids(): void {
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
