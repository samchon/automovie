import type { IMotionCaptureCase } from "@automovie/motions/internal";
import { TouchVerdicts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `TouchVerdicts.times` draws a duration at a fixed step with its named
 * instants: a grid instant within a quarter step of a named one gives way to
 * it, the last instant is the end, and all are in order.
 *
 * Scenarios:
 *
 * 1. Half a second at 0.25 s with a contact named at 0.26 s keeps the contact and
 *    drops the 0.25 s grid instant.
 * 2. Named instants out of order come back sorted.
 */
export function test_unit_motions_executable_touch_verdicts_times(): void {
  TestValidator.equals(
    "the grid around a named instant",
    TouchVerdicts.times(0.5, 0.25, [[0.26, "contact"]]),
    [
      { seconds: 0, label: "0.00 s" },
      { seconds: 0.26, label: "contact" },
      { seconds: 0.5, label: "0.50 s" },
    ] satisfies IMotionCaptureCase.ITime[],
  );
  TestValidator.equals(
    "sorted",
    TouchVerdicts.times(1, 1, [
      [0.6, "b"],
      [0.3, "a"],
    ]).map((t: IMotionCaptureCase.ITime): string => t.label),
    ["0.00 s", "a", "b", "1.00 s"],
  );
}
