import type {
  IMotionCaptureCase
} from "../../../../../packages/motions/src/executable/internal/IMotionCaptureCase";
import {
  floorCaseSpan
} from "../../../../../packages/motions/src/executable/cases/internal/floorCaseSpan";
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the closed millimetre interval for classifying displayed floor heights.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the verdict on an interior span, the exact lower and upper bounds and just outside each side.
 * @evidence contracts/development/testing.md#independent-expectations Height limits −10 and +15 mm admit endpoints. −11 and +16 mm independently distinguish refused below-floor and above-floor measurements.
 */
export function test_motions_executable_floor_case_span(): void {
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
