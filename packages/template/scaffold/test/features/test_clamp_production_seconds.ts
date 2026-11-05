import { TestValidator } from "@nestia/e2e";

import { clampProductionSeconds } from "../../src/clampProductionSeconds";

/**
 * Pin the closed time interval used by actual Viewer seek and redraw completion.
 *
 * Scenarios:
 * 1. Interior values and both endpoints remain exact; outside times hit a bound.
 * 2. Nonfinite time and nonpositive or nonfinite duration fail admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the two scenarios, preserved and bounded times and refused inputs, and the clamp behavior each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the clamp that main.ts imports and asserts preserved interior and endpoint times, bounded outside times and thrown refusals; a wrong endpoint, inverted bound or silently admitted invalid time fails.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the closed interval from zero to a literal fifteen-second duration; 2.125 is exactly representable, so equality needs no tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases Cases cover times just outside each end, both ends, one interior time, each nonfinite time, and zero, negative and nonfinite durations. Browser controls and drawing belong to Viewer review.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with in-memory numbers, discovered by test/index.ts as an exported test_ function; it starts no Viewer, browser or render.
 */
export function test_clamp_production_seconds(): void {
  for (const [seconds, expected] of [
    [-0.125, 0],
    [0, 0],
    [2.125, 2.125],
    [15, 15],
    [15.125, 15],
  ] as const)
    TestValidator.predicate(
      `clamped ${seconds} seconds`,
      clampProductionSeconds(seconds, 15) === expected,
    );

  for (const seconds of [NaN, Infinity, -Infinity])
    TestValidator.error(`nonfinite time ${seconds}`, (): number =>
      clampProductionSeconds(seconds, 15),
    );
  for (const duration of [0, -1, NaN, Infinity, -Infinity])
    TestValidator.error(`invalid duration ${duration}`, (): number =>
      clampProductionSeconds(1, duration),
    );
}
