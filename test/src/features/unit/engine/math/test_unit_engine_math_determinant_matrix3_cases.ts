import { determinantAutoMovieMatrix3 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * Support incidence distinguishes exact cancellation from a small nonzero
 * determinant.
 *
 * Scenarios:
 *
 * 1. Ordinary orientation and a dependent matrix retain their signs/zero.
 * 2. Two binary increments hidden by ordinary cancellation retain determinant
 *    delta squared and its reversed sign.
 * 3. Overflowed or underflowed intermediate products retain a finite answer;
 *    unrepresentable nonzero output refuses.
 */
export function test_unit_engine_math_determinant_matrix3_cases(): void {
  const delta: number = 2 ** -40;
  const matrix: number[] = [1, 1, 1, 1, 1 + delta, 1, 1, 1, 1 + delta];
  TestValidator.predicate(
    "cancellation retains exact binary increment product",
    nclose(determinantAutoMovieMatrix3(matrix), delta ** 2, delta ** 2 * 1e-12),
  );
  TestValidator.predicate(
    "row permutation reverses orientation",
    determinantAutoMovieMatrix3([
      ...matrix.slice(3, 6),
      ...matrix.slice(0, 3),
      ...matrix.slice(6),
    ]) < 0,
  );
  TestValidator.predicate(
    "dependent rows are exact zero",
    determinantAutoMovieMatrix3([1, 2, 3, 1, 2, 3, 4, 5, 6]) === 0,
  );
  TestValidator.predicate(
    "overflowing intermediate products retain a finite independent result",
    nclose(
      determinantAutoMovieMatrix3([
        2 ** 800,
        0,
        0,
        0,
        2 ** 800,
        0,
        0,
        0,
        2 ** -1000,
      ]),
      2 ** 600,
      2 ** 600 * 1e-12,
    ),
  );
  const underflowedProduct: number[] = [
    2 ** -800,
    0,
    2 ** 300,
    0,
    2 ** -800,
    0,
    2 ** -101,
    0,
    2 ** 1000,
  ];
  // a*e underflows before multiplication by i, but a*e*i-c*e*g is
  // exactly 2^-600-2^-601 = 2^-601. Another normal term cannot hide it.
  TestValidator.equals(
    "underflowed intermediate cannot reverse a separated sign",
    determinantAutoMovieMatrix3(underflowedProduct),
    2 ** -601,
  );
  TestValidator.equals(
    "underflowed intermediate retains the opposite orientation",
    determinantAutoMovieMatrix3([
      ...underflowedProduct.slice(3, 6),
      ...underflowedProduct.slice(0, 3),
      ...underflowedProduct.slice(6),
    ]),
    -(2 ** -601),
  );
  for (const input of [[2 ** -400, 0, 0, 0, 2 ** -400, 0, 0, 0, 2 ** -400]]) {
    let refused: boolean = false;
    try {
      determinantAutoMovieMatrix3(input);
    } catch {
      refused = true;
    }
    TestValidator.predicate(
      "unrepresentable or malformed determinant refuses",
      refused,
    );
  }
}
