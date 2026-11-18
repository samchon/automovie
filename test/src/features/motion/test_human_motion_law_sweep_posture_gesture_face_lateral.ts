import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * Near-side and cross-body reach to a paired face landmark preserve their distinct arm paths.
 *
 * Scenarios:
 * 1. Both temples and ears exercise near-side and far-side goals, with each hand taking both roles across the two families.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the relevant geometry and which distinct input targets the scenario compares.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real public gesture in its original stage. The display audit catches excessive penetration, motion discontinuity, missing events and joint range overshoot.
 * @evidence contracts/development/testing.md#independent-expectations The original geometry, timing and joint bounds are shared across input gestures and derive from the physical audit, without reading back the plan's own output as an expectation.
 * @evidence contracts/development/testing.md#distinguishing-cases Both temples and ears exercise near-side and far-side goals, with each hand taking both roles across the two families.
 * @evidence contracts/development/testing.md#execution-ownership The discovered scenario stages and reads the selected actual gestures in memory on contrasting bodies.
 */
export function test_human_motion_law_sweep_posture_gesture_face_lateral(): void {
  TestValidator.equals(
    "Near-side and cross-body reach to a paired face landmark preserve their distinct arm paths",
    motionPostureBranches([
      ["gesture", "region=templeLeft,side=left", "f-small"],
      ["gesture", "region=templeRight,side=left", "m-large"],
      ["gesture", "region=earRight,side=right", "m-large"],
      ["gesture", "region=earLeft,side=right", "f-small"],
    ]),
    [],
  );
}
