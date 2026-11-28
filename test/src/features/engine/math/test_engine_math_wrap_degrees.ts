import { AutoMovieEngineMath } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `wrapDegrees` maps an angle to the half-open interval [-180, 180).
 *
 * Scenarios:
 *
 * 1. Angles inside the interval are unchanged; -180 stays and 180 maps to -180.
 * 2. Angles outside wrap by whole turns: 190 to -170, -190 to 170, 540 to -180.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers ordinary signed angles and both sides of the half-open degree seam.
 * @evidence contracts/development/testing.md#behavioral-verification Passes literal angles to wrapDegrees and compares each result with its written representative.
 * @evidence contracts/development/testing.md#independent-expectations Equivalent angles differ by whole turns. The interval includes -180 and excludes 180, so both 180 and 540 use -180 while the values just beyond the signed half-turns wrap to the opposite side.
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
    TestValidator.equals(`wrap ${input}`, AutoMovieEngineMath.wrapDegrees(input), expected);
}
