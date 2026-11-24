import type { IMotionCaptureCase } from "@automovie/motions/internal";
import { floorCaseSpan } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `floorCaseSpan` passes a range of heights lying within -10 to +15 mm of the
 * floor, its bounds closed.
 *
 * Scenarios:
 *
 * 1. -5 to 10 mm passes and reads in millimetres.
 * 2. -10 to 15 mm, on both bounds, passes.
 * 3. -11 mm, or 16 mm, fails.
 */
export function test_unit_motions_executable_floor_case_span(): void {
  TestValidator.equals(
    "inside, on and outside the band",
    [
      floorCaseSpan("palm", { low: -0.005, high: 0.01 }),
      floorCaseSpan("palm", { low: -0.01, high: 0.015 }).passed,
      floorCaseSpan("palm", { low: -0.011, high: 0 }).passed,
      floorCaseSpan("palm", { low: 0, high: 0.016 }).passed,
    ],
    [
      {
        name: "palm",
        passed: true,
        detail: "-5.0 to 10.0 mm (band -10.0 to 15.0 mm)",
      } satisfies IMotionCaptureCase.IVerdict,
      true,
      false,
      false,
    ],
  );
}
