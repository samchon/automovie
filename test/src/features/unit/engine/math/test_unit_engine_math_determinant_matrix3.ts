import { determinantAutoMovieMatrix3 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../../internal/predicates";

/**
 * `determinantAutoMovieMatrix3` is the determinant of a row-major 3 by 3
 * matrix, exactly zero for a singular one.
 *
 * Scenarios:
 *
 * 1. The identity is 1 and diag(2, 3, 4) is 24.
 * 2. A row-major 1..9 matrix is singular: exactly 0.
 * 3. A matrix of eight entries is refused.
 */
export function test_unit_engine_math_determinant_matrix3(): void {
  TestValidator.equals(
    "identity",
    determinantAutoMovieMatrix3([1, 0, 0, 0, 1, 0, 0, 0, 1]),
    1,
  );
  TestValidator.equals(
    "diagonal",
    determinantAutoMovieMatrix3([2, 0, 0, 0, 3, 0, 0, 0, 4]),
    24,
  );
  TestValidator.equals(
    "singular",
    determinantAutoMovieMatrix3([1, 2, 3, 4, 5, 6, 7, 8, 9]),
    0,
  );
  TestValidator.equals(
    "swapped rows",
    determinantAutoMovieMatrix3([0, 1, 0, 1, 0, 0, 0, 0, 1]),
    -1,
  );
  TestValidator.predicate(
    "short",
    throwsError(() => determinantAutoMovieMatrix3([1, 2, 3, 4, 5, 6, 7, 8])),
  );
}
