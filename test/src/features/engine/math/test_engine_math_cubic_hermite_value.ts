import { cubicHermiteValue } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `cubicHermiteValue` is one scalar of glTF cubic Hermite interpolation.
 *
 * Scenarios:
 *
 * 1. The ends: t = 0 gives the left value and t = 1 the right.
 * 2. Zero tangents at t = 0.5 give the mean of the two values.
 * 3. Left 0, right 0, out tangent 1, span 2, t = 0.5 gives 0.25.
 */
export function test_engine_math_cubic_hermite_value(): void {
  TestValidator.equals("left", cubicHermiteValue(3, 5, 9, 7, 2, 0), 3);
  TestValidator.equals("right", cubicHermiteValue(3, 5, 9, 7, 2, 1), 9);
  TestValidator.equals("middle", cubicHermiteValue(2, 0, 6, 0, 1, 0.5), 4);
  TestValidator.equals("tangent", cubicHermiteValue(0, 1, 0, 0, 2, 0.5), 0.25);
}
