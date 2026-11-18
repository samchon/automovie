import { TestValidator } from "@nestia/e2e";

import { motionHumanLawTouch } from "../internal/motionHumanLawTouch";

/**
 * Both palms press the ipsilateral ears. Neither elbow may jump during release.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the acting hand, surface and motion under test.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the public touch and measures contact, elbow travel, return and the performer's physical audit.
 * @evidence contracts/development/testing.md#independent-expectations Hand colliders must meet the displayed skin within 10 mm at arrival and release. Elbows travel at most 80 mm per 24 Hz frame.
 * @evidence contracts/development/testing.md#distinguishing-cases Both hand contacts are measured in the same performance.
 * @evidence contracts/development/testing.md#execution-ownership The original stage supplies all contact and audit readings.
 */
export function test_human_motion_law_touch_self_cover_ears(): void {
  TestValidator.equals(
    "cover-ears satisfies its contact law",
    motionHumanLawTouch("cover-ears", {
      target: { kind: "self", region: "earRight" },
      other: { kind: "self", region: "earLeft" },
      kind: "press",
    }),
    [],
  );
}
