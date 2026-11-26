import { AutoMovieEngineValidation } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * AlidateUniqueBy reports each later occurrence of an id at that entry's own
 * path and never the first.
 *
 * Scenarios:
 *
 * 1. Distinct ids report nothing.
 * 2. The ids a, b, a, a report the second and third a at their paths, in order.
 */
export function test_engine_validation_unique_by(): void {
  const clean: IAutoMovieConstraintViolation[] = [];
  AutoMovieEngineValidation.validateUniqueBy(
    [
      { id: "a", path: "$.0" },
      { id: "b", path: "$.1" },
    ],
    "id",
    clean,
  );
  TestValidator.equals("distinct", clean.length, 0);

  const found: IAutoMovieConstraintViolation[] = [];
  AutoMovieEngineValidation.validateUniqueBy(
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
