import { AutoMovieEngineMath } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `roundToThousandths` quotes a number at three decimals.
 *
 * Scenarios:
 *
 * 1. 1.2344 rounds down to 1.234 and 1.2346 up to 1.235.
 * 2. A whole number is unchanged, and the largest double is returned as is.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers decimal rounding down and up, a whole number and the largest finite input.
 * @evidence contracts/development/testing.md#behavioral-verification Calls roundToThousandths with four literal scalar values.
 * @evidence contracts/development/testing.md#independent-expectations The inputs 1.2344 and 1.2346 are on opposite sides of the rounding midpoint. Integers already have three-decimal precision. The largest finite value has no fractional part to round.
 */
export function test_engine_math_round_to_thousandths(): void {
  TestValidator.equals("down", AutoMovieEngineMath.roundToThousandths(1.2344), 1.234);
  TestValidator.equals("up", AutoMovieEngineMath.roundToThousandths(1.2346), 1.235);
  TestValidator.equals("whole", AutoMovieEngineMath.roundToThousandths(2), 2);
  TestValidator.equals(
    "largest",
    AutoMovieEngineMath.roundToThousandths(Number.MAX_VALUE),
    Number.MAX_VALUE,
  );
}
