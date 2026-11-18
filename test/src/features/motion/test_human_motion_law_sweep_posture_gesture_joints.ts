import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * Direct-joint gestures keep their head, shoulder and trunk motion clear and continuous.
 *
 * Scenarios:
 * 1. Nod, shake and chin lift exercise alternative head axes. Shrug and square shoulders exercise both shoulder directions. Bow and slump use different trunk patterns.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the relevant geometry and which distinct input targets the scenario compares.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real public gesture in its original stage. The display audit catches excessive penetration, motion discontinuity, missing events and joint range overshoot.
 * @evidence contracts/development/testing.md#independent-expectations The original geometry, timing and joint bounds are shared across input gestures and derive from the physical audit, without reading back the plan's own output as an expectation.
 * @evidence contracts/development/testing.md#distinguishing-cases Nod, shake and chin lift exercise alternative head axes. Shrug and square shoulders exercise both shoulder directions. Bow and slump use different trunk patterns.
 * @evidence contracts/development/testing.md#execution-ownership The discovered scenario stages and reads the selected actual gestures in memory on contrasting bodies.
 */
export function test_human_motion_law_sweep_posture_gesture_joints(): void {
  TestValidator.equals(
    "Direct-joint gestures keep their head, shoulder and trunk motion clear and continuous",
    motionPostureBranches([
      ["gesture", "kind=shrug", "m-large"],
      ["gesture", "kind=nod", "f-small"],
      ["gesture", "kind=shakeHead", "m-large"],
      ["gesture", "kind=bow", "f-small"],
      ["gesture", "kind=chinLift", "m-large"],
      ["gesture", "kind=squareShoulders", "f-small"],
      ["gesture", "kind=slump", "m-large"],
    ]),
    [],
  );
}
