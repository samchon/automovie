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
export function test_engine_math_wrap_degrees(): void {
  const cases: [number, number][] = [
    [0, 0],
    [90, 90],
    [-180, -180],
    [180, -180],
    [190, -170],
    [-190, 170],
    [540, -180],
  ];
  for (const [input, expected] of cases)
    TestValidator.equals(`wrap ${input}`, wrapDegrees(input), expected);
}
