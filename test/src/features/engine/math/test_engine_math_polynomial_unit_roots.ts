import { polynomialUnitRoots } from "@automovie/engine";
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
 */
export function test_engine_math_polynomial_unit_roots(): void {
  const near = (roots: number[], expected: number[]): boolean =>
    roots.length === expected.length &&
    roots.every((r: number, i: number): boolean =>
      nclose(r, expected[i]!, 1e-12),
    );
  TestValidator.equals("constant", polynomialUnitRoots([5]), []);
  TestValidator.equals("zero", polynomialUnitRoots([0, 0, 0]), []);
  TestValidator.predicate("linear", near(polynomialUnitRoots([-1, 2]), [0.5]));
  TestValidator.predicate(
    "one inside",
    near(polynomialUnitRoots([-0.25, 0, 1]), [0.5]),
  );
  TestValidator.predicate(
    "two",
    near(polynomialUnitRoots([0.1875, -1, 1]), [0.25, 0.75]),
  );
  TestValidator.predicate(
    "ends",
    near(polynomialUnitRoots([0, -1, 1]), [0, 1]),
  );
  TestValidator.equals("none inside", polynomialUnitRoots([1, 0, 1]), []);
}
