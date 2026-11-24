import { TouchVerdicts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `TouchVerdicts.touches` counts how often an effector comes down on its
 * region: the local minima of its miss on a 96 Hz grid within the limit, not
 * counting the window's first sample.
 *
 * Scenarios:
 *
 * 1. A miss dipping to zero at 0.25 s and 0.75 s over one second comes down
 *    twice.
 * 2. A limit below both dips counts none.
 * 3. A miss falling from its first sample is not a touch until it dips.
 */
export function test_unit_motions_executable_touch_verdicts_touches(): void {
  const twice = (t: number): number =>
    Math.min(Math.abs(t - 0.25), Math.abs(t - 0.75));
  const rising = (t: number): number => t;
  TestValidator.equals(
    "two dips, none under a tight limit, none at the start",
    [
      TouchVerdicts.touches(twice, 0, 1, 0.01),
      TouchVerdicts.touches(twice, 0, 1, -0.01),
      TouchVerdicts.touches(rising, 0, 1, 0.5),
    ],
    [2, 0, 0],
  );
}
