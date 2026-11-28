import { AutoMovieEngineMath } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `positiveModulo` wraps a value into the half-open period [0, period), so a
 * negative value lands from the top and a value that rounds onto the period
 * itself wraps to zero.
 *
 * Scenarios, period 360:
 *
 * 1. 370.5 wraps to 10.5, -1 to 359, 720 and -360 to 0.
 * 2. -1e-20 lies so close below zero that adding the period rounds to 360 exactly,
 *    which is outside the half-open period: it wraps to 0.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers the half-open period, including a rounded-up tiny negative value.
 * @evidence contracts/development/testing.md#behavioral-verification Calls positiveModulo on decimal, negative, whole-turn and sub-ulp values with period 360.
 * @evidence contracts/development/testing.md#independent-expectations Subtracting whole turns gives 10.5, 359 and zero in the ordinary cases. Adding 360 to -1e-20 rounds to 360, so the half-open range requires zero.
 */
export function test_engine_math_positive_modulo(): void {
  TestValidator.equals(
    "values wrap into [0, 360)",
    [370.5, -1, 720, -360, -1e-20].map((value: number): number =>
      AutoMovieEngineMath.positiveModulo(value, 360),
    ),
    [10.5, 359, 0, 0, 0],
  );
}
