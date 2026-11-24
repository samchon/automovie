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
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls cubicHermiteValue at the ends, the middle and with one tangent and asserts the values.
 * @evidence contracts/development/testing.md#independent-expectations The Hermite basis interpolates its end values, is symmetric with zero tangents, and (t^3 - 2t^2 + t) = 0.125 at t = 0.5 gives 0.25 by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases End, symmetric middle and tangent-only cases separate a wrong basis term from a right one.
 * @evidence contracts/development/testing.md#execution-ownership The named test_unit_engine_math_cubic_hermite_value entry runs portable in-memory literals with no host and no dynamically registered cases.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_unit_engine_math_cubic_hermite_value(): void {
  TestValidator.equals("left", cubicHermiteValue(3, 5, 9, 7, 2, 0), 3);
  TestValidator.equals("right", cubicHermiteValue(3, 5, 9, 7, 2, 1), 9);
  TestValidator.equals("middle", cubicHermiteValue(2, 0, 6, 0, 1, 0.5), 4);
  TestValidator.equals("tangent", cubicHermiteValue(0, 1, 0, 0, 2, 0.5), 0.25);
}
