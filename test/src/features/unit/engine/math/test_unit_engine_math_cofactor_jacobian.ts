import { cofactorAutoMovieJacobian } from "@automovie/engine";
import type { IAutoMovieJacobianCofactor } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../../../internal/equalGeometryTestValues";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/predicates";

/**
 * Positive-Jacobian cofactors retain independently calculated oriented-area
 * transport, while unrepresentable determinant arithmetic refuses. Scenarios:
 *
 * 1. Identity, a 90-degree Z rotation, shear and diagonal stretch retain their
 *    independently calculated determinants and row-major cofactor matrices.
 * 2. Sheared Y tangent (2,1,0) remains orthogonal to transported X normal
 *    (1,-2,0), while treating that normal as a direction fails the same check.
 * 3. Singular, reflected, determinant-underflow and determinant-overflow
 *    matrices refuse.
 * 4. Caller entries and returned storage are independent; a fresh call recovers
 *    after refusal. Cofactor overflow with finite determinant remains a raw
 *    arithmetic observation whose used-vector consumer must admit it.
 */
export function test_unit_engine_math_cofactor_jacobian(): void {
  const identity: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const cases: [number[], number, number[]][] = [
    [identity, 1, identity],
    [[0, -1, 0, 1, 0, 0, 0, 0, 1], 1, [0, -1, 0, 1, 0, 0, 0, 0, 1]],
    [[1, 2, 0, 0, 1, 0, 0, 0, 1], 1, [1, 0, 0, -2, 1, 0, 0, 0, 1]],
    [[2, 0, 0, 0, 3, 0, 0, 0, 4], 24, [12, 0, 0, 0, 8, 0, 0, 0, 6]],
  ];
  for (const [input, determinant, matrix] of cases) {
    const before: number[] = input.slice();
    const result: IAutoMovieJacobianCofactor = cofactorAutoMovieJacobian(input);
    TestValidator.predicate(
      "independent cofactor",
      equalGeometryTestValues(result.matrix, matrix),
    );
    TestValidator.predicate(
      "independent determinant",
      nclose(result.determinant, determinant, 0),
    );
    TestValidator.predicate(
      "caller Jacobian unchanged",
      equalGeometryTestValues(input, before),
    );
    TestValidator.predicate("owned cofactor storage", result.matrix !== input);
  }
  const shear: number[] = cofactorAutoMovieJacobian(cases[2][0]).matrix;
  const transported: number[] = [shear[0], shear[3], shear[6]];
  TestValidator.predicate(
    "sheared tangent stays orthogonal",
    nclose(2 * transported[0] + transported[1], 0, 0),
  );
  const inputShear: number[] = cases[2][0];
  const wrongDirection: number[] = [
    inputShear[0],
    inputShear[3],
    inputShear[6],
  ];
  const tangent: number[] = [inputShear[1], inputShear[4], inputShear[7]];
  TestValidator.predicate(
    "direction transport is a negative control",
    !nclose(
      wrongDirection.reduce(
        (sum: number, value: number, i: number): number =>
          sum + value * tangent[i],
        0,
      ),
      0,
      0,
    ),
  );
  const refused: number[][] = [
    [1, 0, 0, 0, 0, 0, 0, 0, 1],
    [-1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1e-200, 0, 0, 0, 1e-200, 0, 0, 0, 1e-200],
    [1e308, 0, 0, 0, 1e308, 0, 0, 0, 1e308],
  ];
  for (const input of refused) {
    const before: number[] = input.slice();
    TestValidator.predicate(
      "unsupported Jacobian refuses",
      throwsError(
        (): IAutoMovieJacobianCofactor => cofactorAutoMovieJacobian(input),
        "local surface orientation",
      ),
    );
    TestValidator.predicate(
      "refusal preserves entries",
      equalGeometryTestValues(input, before),
    );
  }
  const result: IAutoMovieJacobianCofactor =
    cofactorAutoMovieJacobian(identity);
  result.matrix[0] = 99;
  TestValidator.predicate(
    "owned result cannot change recovery",
    equalGeometryTestValues(
      cofactorAutoMovieJacobian(identity).matrix,
      identity,
    ),
  );
  const wide: IAutoMovieJacobianCofactor = cofactorAutoMovieJacobian([
    1e308, 0, 0, 0, 1e-308, 0, 0, 0, 1e308,
  ]);
  TestValidator.predicate(
    "finite determinant does not certify cofactor range",
    wide.matrix[4] === Infinity,
  );
}
