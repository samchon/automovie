import { bracketedRoot } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A bracketed root search returns the argument where a continuous function
 * crosses zero inside its bracket, in far fewer evaluations than bisection.
 *
 * Scenarios:
 * 1. `x² - 2` on [0, 2] returns √2 within the tolerance, with the bracket
 *    given in either order.
 * 2. `cos x - x` on [0, 1] returns the Dottie number 0.7390851332151607.
 * 3. A function that is zero at an end returns that end without a search.
 * 4. `x³ - 2x - 5` on [2, 3] to 1e-12 takes fewer than 20 evaluations, where
 *    bisection needs 40.
 * 5. A steep and flat function, `exp(8x) - 2` on [-1, 1], where plain false
 *    position stalls on one end, still returns `ln 2 / 8`.
 * 6. Ends of one sign, a non-finite end and a non-positive tolerance throw.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public search and compares the returned argument with the root; a search that stops early, returns the wrong end, or evaluates more than the stated count fails.
 * @evidence contracts/development/testing.md#independent-expectations The roots are known constants: the square root of two, the Dottie number, the cubic's root from Wallis's example and `ln 2 / 8`; the evaluation bound is compared with the 40 halvings bisection needs for the same bracket and tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a smooth root in both bracket orders, a transcendental one, a root on an end, a counted cubic, a function that stalls false position, and three refused inputs.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on closed-form functions; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 scenarios and what each pins.
 */
export function test_math_bracketed_root(): void {
  const close = (a: number, b: number, e: number): boolean =>
    Math.abs(a - b) <= e;
  const square = (x: number): number => x * x - 2;
  TestValidator.predicate(
    "square root of two in either order",
    close(bracketedRoot(square, 0, 2, 1e-12), Math.SQRT2, 1e-11) &&
      close(bracketedRoot(square, 2, 0, 1e-12), Math.SQRT2, 1e-11),
  );
  TestValidator.predicate(
    "the fixed point of the cosine",
    close(
      bracketedRoot((x: number): number => Math.cos(x) - x, 0, 1, 1e-13),
      0.7390851332151607,
      1e-12,
    ),
  );

  let calls: number = 0;
  const counted = (x: number): number => {
    calls++;
    return x - 3;
  };
  TestValidator.predicate(
    "a root at an end is returned as it is",
    bracketedRoot(counted, 3, 5, 1e-9) === 3 &&
      bracketedRoot(counted, 1, 3, 1e-9) === 3 &&
      calls === 4,
  );

  calls = 0;
  const cubic: number = bracketedRoot(
    (x: number): number => {
      calls++;
      return x * x * x - 2 * x - 5;
    },
    2,
    3,
    1e-12,
  );
  TestValidator.predicate(
    "the cubic's root in fewer than twenty evaluations",
    close(cubic, 2.0945514815423265, 1e-11) && calls < 20,
  );
  TestValidator.predicate(
    "a steep function does not stall the search",
    close(
      bracketedRoot((x: number): number => Math.exp(8 * x) - 2, -1, 1, 1e-12),
      Math.LN2 / 8,
      1e-11,
    ),
  );

  TestValidator.error("ends of one sign", (): unknown =>
    bracketedRoot(square, 2, 3, 1e-9),
  );
  TestValidator.error("non-finite end", (): unknown =>
    bracketedRoot(square, 0, Infinity, 1e-9),
  );
  TestValidator.error("zero tolerance", (): unknown =>
    bracketedRoot(square, 0, 2, 0),
  );
}
