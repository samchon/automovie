import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * Open reach and present gestures retain continuous arm paths.
 *
 * Scenarios:
 * 1. One- and two-arm raises, an open palm and a hand gesture exercise different path targets. Pointing on one side and beckoning on the other exercise both side inputs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the relevant geometry and which distinct input targets the scenario compares.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real public gesture in its original stage. The display audit catches excessive penetration, motion discontinuity, missing events and joint range overshoot.
 * @evidence contracts/development/testing.md#independent-expectations The original geometry, timing and joint bounds are shared across input gestures and derive from the physical audit, without reading back the plan's own output as an expectation.
 * @evidence contracts/development/testing.md#distinguishing-cases One- and two-arm raises, an open palm and a hand gesture exercise different path targets. Pointing on one side and beckoning on the other exercise both side inputs.
 * @evidence contracts/development/testing.md#execution-ownership The discovered scenario stages and reads the selected actual gestures in memory on contrasting bodies.
 */
export function test_human_motion_law_sweep_posture_gesture_direct(): void {
  TestValidator.equals(
    "Open reach and present gestures retain continuous arm paths",
    motionPostureBranches([
      ["gesture", "default", "f-small"],
      ["gesture", "kind=raiseHand", "m-large"],
      ["gesture", "kind=cheer", "f-small"],
      ["gesture", "kind=stopPalm", "m-large"],
      ["gesture", "kind=point,side=left", "f-small"],
      ["gesture", "kind=palmsUp", "m-large"],
      ["gesture", "kind=beckon,side=right", "f-small"],
      ["gesture", "kind=thumbsDown", "f-small"],
    ]),
    [],
  );
}
