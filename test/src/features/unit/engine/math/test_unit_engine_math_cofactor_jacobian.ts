import { cofactorAutoMovieJacobian } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../../internal/predicates";

/**
 * `cofactorAutoMovieJacobian` returns det(J) and the cofactor matrix det(J) *
 * inverse(J)^T of a positive-determinant Jacobian.
 *
 * Scenarios:
 *
 * 1. The identity has determinant 1 and cofactor identity.
 * 2. Diag(2, 3, 4) has determinant 24 and cofactor diag(12, 8, 6).
 * 3. A reflection (determinant -1) and a matrix of eight entries are refused.
 */
export function test_unit_engine_math_cofactor_jacobian(): void {
  const identity = cofactorAutoMovieJacobian([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  TestValidator.equals("identity determinant", identity.determinant, 1);
  TestValidator.equals(
    "identity cofactor",
    identity.matrix,
    [1, 0, 0, 0, 1, 0, 0, 0, 1],
  );
  const scale = cofactorAutoMovieJacobian([2, 0, 0, 0, 3, 0, 0, 0, 4]);
  TestValidator.equals("scale determinant", scale.determinant, 24);
  TestValidator.equals(
    "scale cofactor",
    scale.matrix,
    [12, 0, 0, 0, 8, 0, 0, 0, 6],
  );
  TestValidator.predicate(
    "reflection",
    throwsError(() => cofactorAutoMovieJacobian([1, 0, 0, 0, 1, 0, 0, 0, -1])),
  );
  TestValidator.predicate(
    "short",
    throwsError(() => cofactorAutoMovieJacobian([1, 0, 0, 0, 1, 0, 0, 0])),
  );
}
