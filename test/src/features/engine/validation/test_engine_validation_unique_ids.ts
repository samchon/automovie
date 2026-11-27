import { validateUniqueIds } from "@automovie/engine/internal";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * AlidateUniqueIds reports a repeated record id at <path>[index].id of the
 * later record.
 *
 * Scenarios:
 *
 * 1. Ids x, y, x report one row at items[2].id naming the label and the id.
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
