import { type IMotionCaptureCase, TouchVerdicts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The touch captures' verdicts: how often an effector comes down on its region,
 * and its worst miss against a limit.
 *
 * Scenarios:
 *
 * 1. A miss dipping to zero at 0.25 s and 0.75 s over one second comes down twice
 *    on the 96 Hz grid; one falling from its first sample is not a touch.
 * 2. Misses of 1, 4 and 2 mm against a 5 mm limit pass, worst 4 mm at 0.5 s, and
 *    fail a 3 mm limit.
 */
export function test_unit_motions_executable_touch_verdicts(): void {
  TestValidator.equals(
    "two dips, none at the start",
    [
      TouchVerdicts.touches(
        (t: number): number => Math.min(Math.abs(t - 0.25), Math.abs(t - 0.75)),
        0,
        1,
        0.01,
      ),
      TouchVerdicts.touches((t: number): number => t, 0, 1, 0.5),
    ],
    [2, 0],
  );
  const miss = (seconds: number): number =>
    seconds === 0.5 ? 0.004 : seconds === 1 ? 0.002 : 0.001;
  TestValidator.equals(
    "the worst miss against its limit",
    [
      TouchVerdicts.within("palm", miss, [0, 0.5, 1], 0.005),
      TouchVerdicts.within("palm", miss, [0, 0.5, 1], 0.003).passed,
    ],
    [
      {
        name: "palm",
        passed: true,
        detail: "4.0 mm at 0.50 s (limit 5.0 mm)",
      } satisfies IMotionCaptureCase.IVerdict,
      false,
    ],
  );
}
