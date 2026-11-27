import { AutoMovieEngineMath } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `bracketedRoot` returns the argument where a continuous function crosses zero
 * inside its bracket.
 *
 * Scenarios:
 *
 * 1. X^2 - 2 on [0, 2], given in either order, returns the square root of two
 *    within 1e-11 at tolerance 1e-12.
 * 2. Cos x - x on [0, 1] returns the fixed point 0.7390851332151607 within 1e-12.
 * 3. A function that is zero at an end returns that end: x - 3 on [3, 5] and on
 *    [1, 3] both return exactly 3 after four reads in all.
 * 4. X^3 - 2x - 5 on [2, 3] to 1e-12 returns 2.0945514815423265 within 1e-11 in
 *    fewer than 20 evaluations (bisection needs about 40).
 * 5. The steep and flat exp(8x) - 2 on [-1, 1] returns ln 2 / 8 within 1e-11.
 * 6. Ends of one sign, and a zero tolerance, are refused.
 */
export function test_engine_math_bracketed_root(): void {
  const close = (a: number, b: number, tolerance: number): boolean =>
    Math.abs(a - b) <= tolerance;
  const square = (x: number): number => x * x - 2;
  TestValidator.predicate(
    "sqrt two upward",
    close(AutoMovieEngineMath.bracketedRoot(square, 0, 2, 1e-12), Math.SQRT2, 1e-11),
  );
  TestValidator.predicate(
    "sqrt two downward",
    close(AutoMovieEngineMath.bracketedRoot(square, 2, 0, 1e-12), Math.SQRT2, 1e-11),
  );
  TestValidator.predicate(
    "cosine fixed point",
    close(
      AutoMovieEngineMath.bracketedRoot((x: number): number => Math.cos(x) - x, 0, 1, 1e-13),
      0.7390851332151607,
      1e-12,
    ),
  );
  let calls: number = 0;
  const counted = (x: number): number => {
    calls++;
    return x - 3;
  };
  TestValidator.equals(
    "end root, upper",
    AutoMovieEngineMath.bracketedRoot(counted, 3, 5, 1e-9),
    3,
  );
  TestValidator.equals(
    "end root, lower",
    AutoMovieEngineMath.bracketedRoot(counted, 1, 3, 1e-9),
    3,
  );
  TestValidator.equals("reads", calls, 4);
  calls = 0;
  const cubic: number = AutoMovieEngineMath.bracketedRoot(
    (x: number): number => {
      calls++;
      return x * x * x - 2 * x - 5;
    },
    2,
    3,
    1e-12,
  );
  TestValidator.predicate(
    "cubic root",
    close(cubic, 2.0945514815423265, 1e-11),
  );
  TestValidator.predicate("few evaluations", calls < 20);
  TestValidator.predicate(
    "steep function",
    close(
      AutoMovieEngineMath.bracketedRoot((x: number): number => Math.exp(8 * x) - 2, -1, 1, 1e-12),
      Math.LN2 / 8,
      1e-11,
    ),
  );
  TestValidator.predicate(
    "one sign",
    throwsError(() => AutoMovieEngineMath.bracketedRoot(square, 2, 3, 1e-9)),
  );
  TestValidator.predicate(
    "zero tolerance",
    throwsError(() => AutoMovieEngineMath.bracketedRoot(square, 0, 2, 0)),
  );
}
