import { wrapDegrees } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `wrapDegrees` maps an angle to the half-open interval [-180, 180).
 *
 * Scenarios:
 *
 * 1. Angles inside the interval are unchanged; -180 stays and 180 maps to -180.
 * 2. Angles outside wrap by whole turns: 190 to -170, -190 to 170, 540 to -180.
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
