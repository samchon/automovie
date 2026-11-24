import { roundToThousandths } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `roundToThousandths` quotes a number at three decimals.
 *
 * Scenarios:
 *
 * 1. 1.2344 rounds down to 1.234 and 1.2346 up to 1.235.
 * 2. A whole number is unchanged, and the largest double is returned as is.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls roundToThousandths on values either side of a rounding step and on values that need none.
 * @evidence contracts/development/testing.md#independent-expectations Three decimal places means the nearest multiple of 0.001, so each expected value is read off by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Round down versus round up are adjacent; negative ties are not covered here.
 * @evidence contracts/development/testing.md#execution-ownership The named test_unit_engine_math_round_to_thousandths entry runs portable in-memory literals with no host and no dynamically registered cases.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_unit_engine_math_round_to_thousandths(): void {
  TestValidator.equals("down", roundToThousandths(1.2344), 1.234);
  TestValidator.equals("up", roundToThousandths(1.2346), 1.235);
  TestValidator.equals("whole", roundToThousandths(2), 2);
  TestValidator.equals(
    "largest",
    roundToThousandths(Number.MAX_VALUE),
    Number.MAX_VALUE,
  );
}
