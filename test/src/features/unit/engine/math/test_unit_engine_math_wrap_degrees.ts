import { wrapDegrees } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `wrapDegrees` maps an angle to the half-open interval [-180, 180).
 *
 * Scenarios:
 *
 * 1. Angles inside the interval are unchanged; -180 stays and 180 maps to -180.
 * 2. Angles outside wrap by whole turns: 190 to -170, -190 to 170, 540 to -180.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls wrapDegrees on interior, boundary and out-of-range angles and asserts each result.
 * @evidence contracts/development/testing.md#independent-expectations The interval [-180, 180) and the 360 degree period define each expected value, computed by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Both boundaries, one value just beyond each side and a multi-turn value separate a wrong half-open end from a right one.
 * @evidence contracts/development/testing.md#execution-ownership The named test_unit_engine_math_wrap_degrees entry runs portable in-memory literals with no host and no dynamically registered cases.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_unit_engine_math_wrap_degrees(): void {
  for (const [input, expected] of [
    [0, 0],
    [90, 90],
    [-180, -180],
    [180, -180],
    [190, -170],
    [-190, 170],
    [540, -180],
  ] as const)
    TestValidator.equals(`wrap ${input}`, wrapDegrees(input), expected);
}
