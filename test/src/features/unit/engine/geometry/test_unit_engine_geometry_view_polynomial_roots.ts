import {
  rootsAutoMovieViewPolynomial,
  rootsAutoMovieViewSinPolynomial,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `rootsAutoMovieViewPolynomial(coefficients)` lists the roots inside (0, 1) of
 * a polynomial of degree at most nine, and `rootsAutoMovieViewSinPolynomial`
 * those of P(t) + a sin(offset + span t) on a subinterval.
 *
 * Scenarios:
 *
 * 1. (t - 0.2)(t - 0.5)(t - 0.9) gives 0.2, 0.5, 0.9 within 1e-12; 2t - 1 gives
 *    0.5; t - 2 none; a constant and zero none.
 * 2. The double root (t - 0.4)^2 is kept as an observation near 0.4 within 1e-7.
 * 3. Eleven coefficients are refused (RangeError).
 * 4. -0.5 + sin(pi t) on [0, 1] (offset 0, span pi) is zero at 1/6 and 5/6
 *    within 1e-12; on the subinterval [0, 0.5] only 1/6.
 * 5. With no sine it is the polynomial's roots inside the interval; a span past
 *    pi and a reversed interval are refused with the premise message.
 */
export function test_unit_engine_geometry_view_polynomial_roots(): void {
  const near = (a: readonly number[], b: readonly number[], e: number): boolean =>
    a.length === b.length && a.every((x: number, i: number): boolean => Math.abs(x - b[i]!) <= e);

  // 1.
  // (t - 0.2)(t - 0.5)(t - 0.9) = t^3 - 1.6 t^2 + 0.73 t - 0.09
  TestValidator.predicate("cubic", near(rootsAutoMovieViewPolynomial([-0.09, 0.73, -1.6, 1]), [0.2, 0.5, 0.9], 1e-12));
  TestValidator.predicate("linear", near(rootsAutoMovieViewPolynomial([-1, 2]), [0.5], 1e-15));
  TestValidator.equals("none", [rootsAutoMovieViewPolynomial([-2, 1]), rootsAutoMovieViewPolynomial([3]), rootsAutoMovieViewPolynomial([0, 0])], [[], [], []]);

  // 2.
  const double: number[] = rootsAutoMovieViewPolynomial([0.16, -0.8, 1]);
  TestValidator.predicate("double", double.length >= 1 && double.every((t: number): boolean => Math.abs(t - 0.4) <= 1e-7));

  // 3.
  let refused: boolean = false;
  try {
    rootsAutoMovieViewPolynomial(new Array<number>(11).fill(1));
  } catch (error) {
    refused = error instanceof RangeError;
  }
  TestValidator.predicate("eleven", refused);

  // 4.
  const whole = rootsAutoMovieViewSinPolynomial([-0.5], 0, Math.PI, 1);
  TestValidator.predicate("sine", typeof whole !== "string" && near(whole, [1 / 6, 5 / 6], 1e-12));
  const half = rootsAutoMovieViewSinPolynomial([-0.5], 0, Math.PI, 1, [0, 0.5]);
  TestValidator.predicate("subinterval", typeof half !== "string" && near(half, [1 / 6], 1e-12));

  // 5.
  const plain = rootsAutoMovieViewSinPolynomial([-0.09, 0.73, -1.6, 1], 0, 1, 0, [0.3, 1]);
  TestValidator.predicate("no sine", typeof plain !== "string" && near(plain, [0.5, 0.9], 1e-12));
  for (const bad of [rootsAutoMovieViewSinPolynomial([1], 1, 3, 1), rootsAutoMovieViewSinPolynomial([1], 0, 1, 1, [0.6, 0.2])])
    TestValidator.predicate("premise", typeof bad === "string" && bad.includes("increasing angular subinterval"));
}
