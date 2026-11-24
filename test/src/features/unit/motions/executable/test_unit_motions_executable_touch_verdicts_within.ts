import type { IMotionCaptureCase } from "@automovie/motions/internal";
import { TouchVerdicts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `TouchVerdicts.within` passes when the worst miss over the instants stays
 * within the limit, and reports that miss and its second.
 *
 * Scenarios:
 *
 * 1. Misses of 1, 4 and 2 mm against a 5 mm limit pass, worst 4 mm at 0.5 s.
 * 2. The same misses against a 3 mm limit fail.
 * 3. No instants reads no miss and passes.
 */
export function test_unit_motions_executable_touch_verdicts_within(): void {
  const miss = (seconds: number): number =>
    seconds === 0.5 ? 0.004 : seconds === 1 ? 0.002 : 0.001;
  TestValidator.equals(
    "the worst miss against its limit",
    [
      TouchVerdicts.within("palm", miss, [0, 0.5, 1], 0.005),
      TouchVerdicts.within("palm", miss, [0, 0.5, 1], 0.003).passed,
      TouchVerdicts.within("palm", miss, [], 0.003).passed,
    ],
    [
      {
        name: "palm",
        passed: true,
        detail: "4.0 mm at 0.50 s (limit 5.0 mm)",
      } satisfies IMotionCaptureCase.IVerdict,
      false,
      true,
    ],
  );
}
