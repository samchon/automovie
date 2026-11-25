import { cofactorAutoMovieJacobian } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `cofactorAutoMovieJacobian` returns det(J) and the cofactor matrix det(J) *
 * inverse(J)^T of a positive-determinant Jacobian.
 *
 * Scenarios:
 *
 * 1. The identity has determinant 1 and cofactor identity.
 * 2. Diag(2, 3, 4) has determinant 24 and cofactor diag(12, 8, 6).
 * 3. A reflection (determinant -1) and a matrix of eight entries are refused.
 * 4. A quarter turn about z [0,-1,0, 1,0,0, 0,0,1] and the shear [1,2,0, 0,1,0,
 *    0,0,1] have determinant 1 and cofactors [0,-1,0, 1,0,0, 0,0,1] and [1,0,0,
 *    -2,1,0, 0,0,1]; the sheared tangent (2,1,0) is orthogonal to the
 *    transported x normal (1,-2,0). Singular, determinant-underflow (1e-200)
 *    and determinant-overflow (1e308) matrices and a nine-entry-less input are
 *    refused, and the returned matrix is separate storage from the input.
 *    Cofactor overflow with a finite determinant stays raw: [1e308,0,0,
 *    0,1e-308,0, 0,0,1e308] has matrix[4] = Infinity.
 */
export function test_engine_math_cofactor_jacobian(): void {
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
  const turn: number[] = [0, -1, 0, 1, 0, 0, 0, 0, 1];
  TestValidator.equals("turn", cofactorAutoMovieJacobian(turn).matrix, turn);
  const shear: number[] = [1, 2, 0, 0, 1, 0, 0, 0, 1];
  const sheared = cofactorAutoMovieJacobian(shear);
  TestValidator.equals("shear determinant", sheared.determinant, 1);
  TestValidator.equals(
    "shear cofactor",
    sheared.matrix,
    [1, 0, 0, -2, 1, 0, 0, 0, 1],
  );
  TestValidator.equals(
    "tangent stays orthogonal",
    2 * sheared.matrix[0]! + sheared.matrix[3]!,
    0,
  );
  const unit: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const result = cofactorAutoMovieJacobian(unit);
  TestValidator.predicate("owned storage", result.matrix !== unit);
  result.matrix[0] = 99;
  TestValidator.equals(
    "recovers",
    cofactorAutoMovieJacobian(unit).matrix,
    unit,
  );
  for (const input of [
    [1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1e-200, 0, 0, 0, 1e-200, 0, 0, 0, 1e-200],
    [1e308, 0, 0, 0, 1e308, 0, 0, 0, 1e308],
  ])
    TestValidator.predicate(
      "refused",
      throwsError(
        () => cofactorAutoMovieJacobian(input),
        ["local surface orientation"],
      ),
    );
  TestValidator.predicate(
    "nine entries",
    throwsError(
      () => cofactorAutoMovieJacobian([...unit, 0]),
      ["nine row-major"],
    ),
  );
  TestValidator.equals(
    "raw cofactor overflow",
    cofactorAutoMovieJacobian([1e308, 0, 0, 0, 1e-308, 0, 0, 0, 1e308])
      .matrix[4],
    Infinity,
  );
  for (const input of [[], unit.slice(0, 8)])
    TestValidator.predicate(
      "short",
      throwsError(() => cofactorAutoMovieJacobian(input), ["nine row-major"]),
    );
}
