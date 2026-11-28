import { AutoMovieEngineMath } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * `polynomialUnitRoots` finds the real roots on [0, 1] of a polynomial given by
 * ascending coefficients.
 *
 * Scenarios:
 *
 * 1. A constant and the zero polynomial have none.
 * 2. 2x - 1 has the root 1/2; x^2 - 1/4 has only 1/2 on the interval (-1/2 lies
 *    outside).
 * 3. X^2 - x + 3/16 = (x - 1/4)(x - 3/4) has both roots, ascending.
 * 4. X^2 - x has the roots 0 and 1 at the ends.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers constant and zero polynomials, linear and quadratic roots, endpoint inclusion and out-of-interval filtering.
 * @evidence contracts/development/testing.md#behavioral-verification Passes ascending coefficient arrays directly to polynomialUnitRoots and compares the ordered result arrays.
 * @evidence contracts/development/testing.md#independent-expectations Factoring gives 1/2 for the linear case, plus and minus 1/2 for x^2 - 1/4, 1/4 and 3/4 for the two-root case, and zero and one for x(x - 1). The interval excludes the negative and outlying roots.
 */
export function test_engine_math_polynomial_unit_roots(): void {
  const near = (roots: number[], expected: number[]): boolean =>
    roots.length === expected.length &&
    roots.every((r: number, i: number): boolean =>
      nclose(r, expected[i]!, 1e-12),
    );
  TestValidator.equals("constant", AutoMovieEngineMath.polynomialUnitRoots([5]), []);
  TestValidator.equals("zero", AutoMovieEngineMath.polynomialUnitRoots([0, 0, 0]), []);
  TestValidator.predicate("linear", near(AutoMovieEngineMath.polynomialUnitRoots([-1, 2]), [0.5]));
  TestValidator.predicate(
    "one inside",
    near(AutoMovieEngineMath.polynomialUnitRoots([-0.25, 0, 1]), [0.5]),
  );
  TestValidator.predicate(
    "two",
    near(AutoMovieEngineMath.polynomialUnitRoots([0.1875, -1, 1]), [0.25, 0.75]),
  );
  TestValidator.predicate(
    "ends",
    near(AutoMovieEngineMath.polynomialUnitRoots([0, -1, 1]), [0, 1]),
  );
  TestValidator.equals("none inside", AutoMovieEngineMath.polynomialUnitRoots([1, 0, 1]), []);
}
