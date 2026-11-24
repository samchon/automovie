import { midpoint } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `midpoint` is the binary64 mean of two coordinates and stays finite where the
 * sum overflows.
 *
 * Scenarios:
 *
 * 1. Ordinary pair: (2, 4) is 3 and (-6, 2) is -2.
 * 2. Two equal largest doubles give that double, positive and negative.
 */
export function test_unit_engine_math_midpoint(): void {
  TestValidator.equals("ordinary", midpoint(2, 4), 3);
  TestValidator.equals("opposite", midpoint(-6, 2), -2);
  TestValidator.equals(
    "positive overflow",
    midpoint(Number.MAX_VALUE, Number.MAX_VALUE),
    Number.MAX_VALUE,
  );
  TestValidator.equals(
    "negative overflow",
    midpoint(-Number.MAX_VALUE, -Number.MAX_VALUE),
    -Number.MAX_VALUE,
  );
}
