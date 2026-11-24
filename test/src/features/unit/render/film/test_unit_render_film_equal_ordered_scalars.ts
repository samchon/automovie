import { equalOrderedScalars } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `equalOrderedScalars` compares ordered lists of scalars or of scalar rows by
 * value with `Object.is`: same length, same positions, same types.
 *
 * Scenarios:
 *
 * 1. ["front-left", "front-right"] equals itself; [[0.5, 0.5]] equals [[0.5,
 *    0.5]].
 * 2. Reordered labels, a row against a scalar, rows of different length and +0
 *    against −0 differ.
 */
export function test_unit_render_film_equal_ordered_scalars(): void {
  TestValidator.predicate(
    "equal labels",
    equalOrderedScalars(
      ["front-left", "front-right"],
      ["front-left", "front-right"],
    ),
  );
  TestValidator.predicate(
    "equal rows",
    equalOrderedScalars([[0.5, 0.5]], [[0.5, 0.5]]),
  );
  TestValidator.predicate(
    "reordered labels",
    !equalOrderedScalars(["a", "b"], ["b", "a"]),
  );
  TestValidator.predicate(
    "a row against a scalar",
    !equalOrderedScalars([[1]], [1]),
  );
  TestValidator.predicate(
    "rows of another length",
    !equalOrderedScalars([[1, 2]], [[1]]),
  );
  TestValidator.predicate("signed zeros", !equalOrderedScalars([0], [-0]));
}
