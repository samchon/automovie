import { roundToThousandths } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `roundToThousandths` quotes a number at three decimals.
 *
 * Scenarios:
 *
 * 1. 1.2344 rounds down to 1.234 and 1.2346 up to 1.235.
 * 2. A whole number is unchanged, and the largest double is returned as is.
 */
export function test_engine_math_round_to_thousandths(): void {
  TestValidator.equals("down", roundToThousandths(1.2344), 1.234);
  TestValidator.equals("up", roundToThousandths(1.2346), 1.235);
  TestValidator.equals("whole", roundToThousandths(2), 2);
  TestValidator.equals(
    "largest",
    roundToThousandths(Number.MAX_VALUE),
    Number.MAX_VALUE,
  );
}
