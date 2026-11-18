import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * Gesturing toward a central landmark preserves the contact path.
 *
 * Scenarios:
 * 1. Default face contact and each central landmark vary the arm target height and depth. The torso and face remain subject to the skin bound.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the relevant geometry and which distinct input targets the scenario compares.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real public gesture in its original stage. The display audit catches excessive penetration, motion discontinuity, missing events and joint range overshoot.
 * @evidence contracts/development/testing.md#independent-expectations The original geometry, timing and joint bounds are shared across input gestures and derive from the physical audit, without reading back the plan's own output as an expectation.
 * @evidence contracts/development/testing.md#distinguishing-cases Default face contact and each central landmark vary the arm target height and depth. The torso and face remain subject to the skin bound.
 * @evidence contracts/development/testing.md#execution-ownership The discovered scenario stages and reads the selected actual gestures in memory on contrasting bodies.
 */
export function test_human_motion_law_sweep_posture_gesture_face_central(): void {
  TestValidator.equals(
    "Gesturing toward a central landmark preserves the contact path",
    motionPostureBranches([
      ["gesture", "kind=touchFace", "m-large"],
      ["gesture", "region=forehead,side=left", "m-large"],
      ["gesture", "region=noseBridge,side=right", "f-small"],
      ["gesture", "region=mouth,side=left", "m-large"],
      ["gesture", "region=chin,side=right", "f-small"],
      ["gesture", "region=nape", "m-large"],
    ]),
    [],
  );
}
