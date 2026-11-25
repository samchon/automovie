import { positiveModulo } from "@automovie/engine";
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
 */
export function test_unit_engine_math_positive_modulo(): void {
  TestValidator.equals(
    "values wrap into [0, 360)",
    [370.5, -1, 720, -360, -1e-20].map((value: number): number =>
      positiveModulo(value, 360),
    ),
    [10.5, 359, 0, 0, 0],
  );
}
