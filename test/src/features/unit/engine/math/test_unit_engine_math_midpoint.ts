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
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls midpoint on ordinary and overflow-prone pairs and asserts the means.
 * @evidence contracts/development/testing.md#independent-expectations The arithmetic mean of two numbers is defined independently of the code; equal operands have themselves as mean.
 * @evidence contracts/development/testing.md#distinguishing-cases An ordinary pair is the adjacent case to the pair whose sum is beyond the largest double.
 * @evidence contracts/development/testing.md#execution-ownership The named test_unit_engine_math_midpoint entry runs portable in-memory literals with no host and no dynamically registered cases.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the numbered scenarios it runs, each naming the input and the behavior it pins.
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
