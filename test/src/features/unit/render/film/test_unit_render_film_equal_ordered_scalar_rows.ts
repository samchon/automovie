import { equalOrderedScalarRows } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `equalOrderedScalarRows` compares lists of scalar rows: as many rows, each
 * pair equal position by position.
 *
 * Scenarios:
 *
 * 1. The stereo downmix [[0.5, 0.5]] equals itself.
 * 2. [[0.5, 0.5]] against [[0.5]], [[1]] against [[1], [1]] and [[1, 0]] against
 *    [[0, 1]] differ.
 */
export function test_unit_render_film_equal_ordered_scalar_rows(): void {
  TestValidator.predicate(
    "equal rows",
    equalOrderedScalarRows([[0.5, 0.5]], [[0.5, 0.5]]),
  );
  TestValidator.predicate(
    "a shorter row",
    !equalOrderedScalarRows([[0.5, 0.5]], [[0.5]]),
  );
  TestValidator.predicate(
    "another row count",
    !equalOrderedScalarRows([[1]], [[1], [1]]),
  );
  TestValidator.predicate(
    "reordered entries",
    !equalOrderedScalarRows([[1, 0]], [[0, 1]]),
  );
}
