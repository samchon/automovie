import { TestValidator } from "@nestia/e2e";

import { motionHumanLawTouch } from "../internal/motionHumanLawTouch";

/**
 * Both arms squeeze the shoulders across the chest and admit six authored arm and chest rests.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the acting hand, surface and motion under test.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the public touch and measures contact, elbow travel, return and the performer's physical audit.
 * @evidence contracts/development/testing.md#independent-expectations Hand colliders must meet the displayed skin within 10 mm at arrival and release. Elbows travel at most 80 mm per 24 Hz frame.
 * @evidence contracts/development/testing.md#distinguishing-cases Both hand contacts are measured in the same performance.
 * @evidence contracts/development/testing.md#execution-ownership The original stage supplies all contact and audit readings.
 */
export function test_human_motion_law_touch_self_hug_self(): void {
  TestValidator.equals(
    "hug-self satisfies its contact law",
    motionHumanLawTouch("hug-self", {
      target: { kind: "self", region: "shoulderLeft" },
      other: { kind: "self", region: "shoulderRight" },
      kind: "squeeze",
      rests: [
        { hand: "first", part: "lowerArm", on: "leftLowerArm" },
        { hand: "first", part: "lowerArm", on: "chest" },
        { hand: "first", part: "upperArm", on: "chest" },
        { hand: "other", part: "lowerArm", on: "rightLowerArm" },
        { hand: "other", part: "lowerArm", on: "chest" },
        { hand: "other", part: "upperArm", on: "chest" },
      ],
    }),
    [],
  );
}
