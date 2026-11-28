import { AutoMovieEngineMath } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * `bracketedMinimum` finds the least point of a one-variable function on an
 * interval by Brent's method.
 *
 * Scenarios:
 *
 * 1. (x - 0.3)^2 on [0, 1] has its least at 0.3 with value 0, found within 1e-4
 *    whichever end is passed first.
 * 2. |x - 0.7| (a kink) on [0, 1] is found at 0.7 within 1e-4.
 * 3. A zero tolerance is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers a smooth minimum with either input ordering, a kink minimum, and invalid tolerance.
 * @evidence contracts/development/testing.md#behavioral-verification Calls bracketedMinimum on the elementary parabola and absolute-value functions and checks location and value. A separate direct call supplies zero tolerance.
 * @evidence contracts/development/testing.md#independent-expectations A square is minimized where its base is zero, giving 0.3 and value zero. Absolute value has its kink minimum at 0.7. The location and value bounds are fixed before evaluation.
 */
export function test_engine_math_bracketed_minimum(): void {
  const a = AutoMovieEngineMath.bracketedMinimum((x: number): number => (x - 0.3) ** 2, 0, 1, 1e-9);
  TestValidator.predicate(
    "parabola",
    nclose(a.at, 0.3, 1e-4) && nclose(a.value, 0, 1e-8),
  );
  const b = AutoMovieEngineMath.bracketedMinimum((x: number): number => (x - 0.3) ** 2, 1, 0, 1e-9);
  TestValidator.predicate("reversed ends", nclose(b.at, 0.3, 1e-4));
  const kink = AutoMovieEngineMath.bracketedMinimum(
    (x: number): number => Math.abs(x - 0.7),
    0,
    1,
    1e-9,
  );
  TestValidator.predicate("kink", nclose(kink.at, 0.7, 1e-4));
  TestValidator.predicate(
    "tolerance",
    throwsError(() => AutoMovieEngineMath.bracketedMinimum((x: number): number => x, 0, 1, 0)),
  );
}
