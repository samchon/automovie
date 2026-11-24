import type { IMotionCaptureCase } from "@automovie/motions/internal";
import { everydayVerdicts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `everydayVerdicts.within` passes a measure at or below its limit and shows it
 * in millimetres for metres, or in degrees.
 *
 * Scenarios:
 *
 * 1. A 3 mm slip under a 5 mm limit passes.
 * 2. A 2 degree overshoot over a 1 degree limit fails.
 * 3. A value equal to its limit passes.
 */
export function test_unit_motions_executable_everyday_verdicts_within(): void {
  TestValidator.equals(
    "under, over and at the limit",
    [
      everydayVerdicts.within("slip", 0.003, 0.005, "mm"),
      everydayVerdicts.within("rom", 2, 1, "deg"),
      everydayVerdicts.within("rom", 1, 1, "deg").passed,
    ],
    [
      {
        name: "slip",
        passed: true,
        detail: "3.0 mm (limit 5.0 mm)",
      } satisfies IMotionCaptureCase.IVerdict,
      {
        name: "rom",
        passed: false,
        detail: "2.00 deg (limit 1.00 deg)",
      } satisfies IMotionCaptureCase.IVerdict,
      true,
    ],
  );
}
