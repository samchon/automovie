import { cofactorAutoMovieJacobian } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieJacobianCofactor } from "@automovie/engine";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/predicates";

/**
 * Positive-Jacobian cofactors retain independently calculated oriented-area transport, while unrepresentable determinant arithmetic refuses.
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
 *
 * @evidence contracts/testing.md#behavioral-verification Computes cofactors and determinants for identity, rotation, shear and diagonal stretch, checking independent matrices, tangent/normal orthogonality, input/result ownership and refusals. A finite determinant with an overflowing cofactor remains observable rather than being mistaken for an admitted transported vector.
 * @evidence contracts/testing.md#independent-expectations Diagonal (2,3,4) has determinant 24 and cofactors (12,8,6); the authored shear transports X normal to (1,-2,0), perpendicular to (2,1,0). Literal algebraic expectations use zero-tolerance nclose with structural matrix checks. The test observes arithmetic and does not prove a deformed mesh's topology or finite used normals.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the four supported matrices, wrong-direction negative control, wrong/sparse populations, nonfinite components, singular/reflected/underflow/overflow determinants, unchanged caller entries, fresh-result recovery and finite-determinant cofactor overflow. Mesh deformation owns actual face and transported-vector admission.
 * @evidence contracts/testing.md#execution-ownership This named math entry executes portable cofactor source synchronously with original numeric records and local observers. It installs no consumer, builds no native artifact and starts no process, browser or GPU; no cases are dynamically registered.
 */
export function test_math_jacobian_cofactor(): void {
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
  const sparse: number[] = new Array<number>(9);
  for (let index: number = 0; index < 9; index++)
    if (index !== 4) sparse[index] = identity[index];
  const refused: number[][] = [
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
    const before: number[] = input.slice();
    TestValidator.predicate(
      "unsupported Jacobian refuses",
      throwsError(
        (): IAutoMovieJacobianCofactor => cofactorAutoMovieJacobian(input),
        input.length === 9 ? "local surface orientation" : "nine row-major",
      ),
    );
    TestValidator.predicate(
      "refusal preserves entries",
      Array.from(
        { length: input.length },
        (_: unknown, i: number): number => i,
      ).every((i: number): boolean => Object.is(input[i], before[i])),
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
    Number.isFinite(wide.determinant) && wide.matrix[4] === Infinity,
  );
}
