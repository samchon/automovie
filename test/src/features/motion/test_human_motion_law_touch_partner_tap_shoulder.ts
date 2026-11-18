import { TestValidator } from "@nestia/e2e";

import { motionHumanLawTouch } from "../internal/motionHumanLawTouch";

/**
 * Fingertips tap the facing partner's left shoulder twice, a lateral target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the acting hand, surface and motion under test.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the public touch and measures contact, elbow travel, return and the performer's physical audit.
 * @evidence contracts/development/testing.md#independent-expectations Hand colliders must meet the displayed skin within 10 mm at arrival and release. Elbows travel at most 80 mm per 24 Hz frame.
 * @evidence contracts/development/testing.md#distinguishing-cases Bilateral reflection of the displayed bones is measured at 4 Hz within 5 mm.
 * @evidence contracts/development/testing.md#execution-ownership The original stage supplies all contact and audit readings.
 */
export function test_human_motion_law_touch_partner_tap_shoulder(): void {
  TestValidator.equals(
    "tap-shoulder satisfies its contact law",
    motionHumanLawTouch(
      "tap-shoulder",
      {
        target: { kind: "person", subject: "b", region: "shoulderLeft" },
        kind: "tap",
        with: "fingertips",
        count: 2,
      },
      { facing: true, gap: 0.55, mirror: true },
    ),
    [],
  );
}
