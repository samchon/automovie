import { cofactorAutoMovieJacobian } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * The shared positive-Jacobian arithmetic transports area and normal covectors
 * without changing the original mesh deformer's ordered cross products.
 * Scenarios:
 * 1. Identity, a 90-degree Z rotation, shear and diagonal stretch retain their
 *    independently calculated determinants and row-major cofactor matrices.
 * 2. Sheared Y tangent (2,1,0) remains orthogonal to transported X normal
 *    (1,-2,0), while treating that normal as a direction fails the same check.
 * 3. Sparse/wrong populations, nonfinite entries, singular, reflected,
 *    determinant-underflow and determinant-overflow matrices refuse.
 * 4. Caller entries and returned storage are independent; a fresh call recovers
 *    after refusal. Cofactor overflow with finite determinant remains a raw
 *    arithmetic observation whose used-vector consumer must admit it.
 */
export const test_math_jacobian_cofactor = (): void => {
  const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const cases: [number[], number, number[]][] = [
    [identity, 1, identity],
    [[0, -1, 0, 1, 0, 0, 0, 0, 1], 1, [0, -1, 0, 1, 0, 0, 0, 0, 1]],
    [[1, 2, 0, 0, 1, 0, 0, 0, 1], 1, [1, 0, 0, -2, 1, 0, 0, 0, 1]],
    [[2, 0, 0, 0, 3, 0, 0, 0, 4], 24, [12, 0, 0, 0, 8, 0, 0, 0, 6]],
  ];
  for (const [input, determinant, matrix] of cases) {
    const before = input.slice();
    const result = cofactorAutoMovieJacobian(input);
    TestValidator.equals("independent cofactor", result.matrix, matrix);
    TestValidator.equals(
      "independent determinant",
      result.determinant,
      determinant,
    );
    TestValidator.equals("caller Jacobian unchanged", input, before);
    TestValidator.predicate("owned cofactor storage", result.matrix !== input);
  }
  const shear = cofactorAutoMovieJacobian(cases[2][0]).matrix;
  const transported = [shear[0], shear[3], shear[6]];
  TestValidator.equals(
    "sheared tangent stays orthogonal",
    2 * transported[0] + transported[1],
    0,
  );
  const inputShear = cases[2][0];
  const wrongDirection = [inputShear[0], inputShear[3], inputShear[6]];
  const tangent = [inputShear[1], inputShear[4], inputShear[7]];
  TestValidator.predicate(
    "direction transport is a negative control",
    wrongDirection.reduce((sum, value, i) => sum + value * tangent[i], 0) !== 0,
  );
  const sparse = new Array<number>(9);
  for (let index = 0; index < 9; index++)
    if (index !== 4) sparse[index] = identity[index];
  const refused = [
    [],
    identity.slice(0, 8),
    [...identity, 0],
    sparse,
    [NaN, ...identity.slice(1)],
    [Infinity, ...identity.slice(1)],
    [1, 0, 0, 0, 0, 0, 0, 0, 1],
    [-1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1e-200, 0, 0, 0, 1e-200, 0, 0, 0, 1e-200],
    [1e308, 0, 0, 0, 1e308, 0, 0, 0, 1e308],
  ];
  for (const input of refused) {
    const before = input.slice();
    TestValidator.predicate(
      "unsupported Jacobian refuses",
      throwsError(
        () => cofactorAutoMovieJacobian(input),
        input.length === 9 ? "local surface orientation" : "nine row-major",
      ),
    );
    TestValidator.predicate(
      "refusal preserves entries",
      Array.from({ length: input.length }, (_, i) => i).every((i) =>
        Object.is(input[i], before[i]),
      ),
    );
  }
  const result = cofactorAutoMovieJacobian(identity);
  result.matrix[0] = 99;
  TestValidator.equals(
    "owned result cannot change recovery",
    cofactorAutoMovieJacobian(identity).matrix,
    identity,
  );
  const wide = cofactorAutoMovieJacobian([
    1e308, 0, 0, 0, 1e-308, 0, 0, 0, 1e308,
  ]);
  TestValidator.predicate(
    "finite determinant does not certify cofactor range",
    Number.isFinite(wide.determinant) && wide.matrix[4] === Infinity,
  );
};
