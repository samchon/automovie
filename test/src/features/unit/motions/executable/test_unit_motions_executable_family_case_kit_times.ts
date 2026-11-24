import type { IMotionCaptureCase } from "@automovie/motions/internal";
import { FamilyCaseKit } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `FamilyCaseKit.times` draws a whole performance at a fixed step with its
 * named instants: a grid instant within a quarter step of a named one gives way
 * to it, the last instant is the performance's end, and all are in order.
 *
 * Scenarios:
 *
 * 1. A one-second performance at 0.25 s with a hit at 0.3 s: the 0.25 s grid
 *    instant gives way, the others keep their captions.
 * 2. A 0.9 s performance ends on its own end, not on the next step.
 */
export function test_unit_motions_executable_family_case_kit_times(): void {
  TestValidator.equals(
    "the grid around a named instant",
    FamilyCaseKit.times({ duration: 1 }, 0.25, [[0.3, "hit"]]),
    [
      { seconds: 0, label: "0.00 s" },
      { seconds: 0.3, label: "hit" },
      { seconds: 0.5, label: "0.50 s" },
      { seconds: 0.75, label: "0.75 s" },
      { seconds: 1, label: "1.00 s" },
    ] satisfies IMotionCaptureCase.ITime[],
  );
  TestValidator.equals(
    "the end",
    FamilyCaseKit.times({ duration: 0.9 }, 0.25, []).map(
      (t: IMotionCaptureCase.ITime): number => t.seconds,
    ),
    [0, 0.25, 0.5, 0.75, 0.9],
  );
}
