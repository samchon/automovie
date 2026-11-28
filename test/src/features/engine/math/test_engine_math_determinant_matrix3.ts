import { AutoMovieEngineMath } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * `determinantMatrix3` is the determinant of a row-major 3 by 3
 * matrix, exactly zero for a singular one.
 *
 * Scenarios:
 *
 * 1. The identity is 1 and diag(2, 3, 4) is 24.
 * 2. A row-major 1..9 matrix is singular: exactly 0.
 * 3. A matrix of eight entries is refused.
 * 4. Cancellation: [1,1,1, 1,1+d,1, 1,1,1+d] with d = 2^-40 has determinant d^2,
 *    its row permutation is negative, and dependent rows [1,2,3,1,2,3,4,5,6]
 *    are exactly 0. Intermediate products past the double range: diag(2^800,
 *    2^800, 2^-1000) is 2^600; an underflowing a*e term gives exactly 2^-601
 *    and its row permutation -(2^-601); diag(2^-400 x3) has an unrepresentable
 *    determinant and is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers determinant sign and magnitude, singularity, cancellation, intermediate overflow and underflow, and admission failures.
 * @evidence contracts/development/testing.md#behavioral-verification Calls determinantMatrix3 on explicit row-major matrices. It tests exact or bounded results and invokes the same operation for malformed size and unrepresentable determinants.
 * @evidence contracts/development/testing.md#independent-expectations Row dependence and row permutation establish zero and sign. Subtracting the first row in the cancellation fixture yields delta squared. The diagonal and sparse matrices reduce to powers of two even when evaluation intermediates exceed binary64 range.
 */
export function test_engine_math_determinant_matrix3(): void {
  TestValidator.equals(
    "identity",
    AutoMovieEngineMath.determinantMatrix3([1, 0, 0, 0, 1, 0, 0, 0, 1]),
    1,
  );
  TestValidator.equals(
    "diagonal",
    AutoMovieEngineMath.determinantMatrix3([2, 0, 0, 0, 3, 0, 0, 0, 4]),
    24,
  );
  TestValidator.equals(
    "singular",
    AutoMovieEngineMath.determinantMatrix3([1, 2, 3, 4, 5, 6, 7, 8, 9]),
    0,
  );
  TestValidator.equals(
    "swapped rows",
    AutoMovieEngineMath.determinantMatrix3([0, 1, 0, 1, 0, 0, 0, 0, 1]),
    -1,
  );
  TestValidator.predicate(
    "short",
    throwsError(() => AutoMovieEngineMath.determinantMatrix3([1, 2, 3, 4, 5, 6, 7, 8])),
  );
  const delta: number = 2 ** -40;
  const near: number[] = [1, 1, 1, 1, 1 + delta, 1, 1, 1, 1 + delta];
  TestValidator.predicate(
    "cancellation keeps delta squared",
    nclose(AutoMovieEngineMath.determinantMatrix3(near), delta ** 2, delta ** 2 * 1e-12),
  );
  TestValidator.predicate(
    "row permutation reverses the sign",
    AutoMovieEngineMath.determinantMatrix3([
      ...near.slice(3, 6),
      ...near.slice(0, 3),
      ...near.slice(6),
    ]) < 0,
  );
  TestValidator.equals(
    "dependent rows",
    AutoMovieEngineMath.determinantMatrix3([1, 2, 3, 1, 2, 3, 4, 5, 6]),
    0,
  );
  TestValidator.predicate(
    "overflowing intermediates",
    nclose(
      AutoMovieEngineMath.determinantMatrix3([
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
  const underflowed: number[] = [
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
  TestValidator.equals(
    "underflowed intermediate",
    AutoMovieEngineMath.determinantMatrix3(underflowed),
    2 ** -601,
  );
  TestValidator.equals(
    "underflowed opposite orientation",
    AutoMovieEngineMath.determinantMatrix3([
      ...underflowed.slice(3, 6),
      ...underflowed.slice(0, 3),
      ...underflowed.slice(6),
    ]),
    -(2 ** -601),
  );
  TestValidator.predicate(
    "unrepresentable",
    throwsError(() =>
      AutoMovieEngineMath.determinantMatrix3([
        2 ** -400,
        0,
        0,
        0,
        2 ** -400,
        0,
        0,
        0,
        2 ** -400,
      ]),
    ),
  );
}
