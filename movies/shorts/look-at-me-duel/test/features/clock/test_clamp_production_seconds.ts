import { TestValidator } from "@nestia/e2e";

import { clampProductionSeconds } from "../../../src/clampProductionSeconds";

/**
 * Pin the closed time interval used by actual Viewer seek and redraw completion.
 *
 * Scenarios:
 * 1. Interior values and both endpoints remain exact; outside times hit a bound.
 * 2. Nonfinite time and nonpositive or nonfinite duration fail admission.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the same pure clamp imported by main.ts and asserts time preservation, endpoint bounds and input refusals; detects a wrong endpoint, inverted bound or silent invalid time. Browser controls and rendering are separate Viewer checks.
 * @evidence contracts/testing.md#independent-cases Literal zero and fifteen-second bounds define expectations; interior 2.125 is exactly representable and preserved, so these assertions need no fitted tolerance. Cases include adjacent out-of-range times, each nonfinite time and zero, negative and nonfinite durations; no host is started.
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
