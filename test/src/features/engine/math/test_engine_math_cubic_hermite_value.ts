import { AutoMovieEngineMath } from "@automovie/engine";
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
 * @evidence contracts/development/common.md#meaningful-documentation Covers scalar interpolation endpoints, a zero-tangent midpoint and span-weighted tangent contribution.
 * @evidence contracts/development/testing.md#behavioral-verification Calls cubicHermiteValue with literal endpoint values and tangents at shares zero, one and one half.
 * @evidence contracts/development/testing.md#independent-expectations Hermite basis weights reduce to endpoint selection at shares zero and one. At one half the endpoint weights are equal and the outgoing tangent weight is 1/8, giving 1/4 for a unit tangent over span two.
 */
export function test_engine_math_cubic_hermite_value(): void {
  TestValidator.equals("left", AutoMovieEngineMath.cubicHermiteValue(3, 5, 9, 7, 2, 0), 3);
  TestValidator.equals("right", AutoMovieEngineMath.cubicHermiteValue(3, 5, 9, 7, 2, 1), 9);
  TestValidator.equals("middle", AutoMovieEngineMath.cubicHermiteValue(2, 0, 6, 0, 1, 0.5), 4);
  TestValidator.equals("tangent", AutoMovieEngineMath.cubicHermiteValue(0, 1, 0, 0, 2, 0.5), 0.25);
}
