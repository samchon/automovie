import { TestValidator } from "@nestia/e2e";

import { motionHumanLawTouch } from "../internal/motionHumanLawTouch";

/**
 * The palm stays at the cheek throughout the hold while the facing partner sways.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the acting hand, surface and motion under test.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the public touch and measures contact, elbow travel, return and the performer's physical audit.
 * @evidence contracts/development/testing.md#independent-expectations Hand colliders must meet the displayed skin within 10 mm at arrival and release. Elbows travel at most 80 mm per 24 Hz frame.
 * @evidence contracts/development/testing.md#distinguishing-cases The lateral reflection of a facing partner is measured on the shoulder tap.
 * @evidence contracts/development/testing.md#execution-ownership The original stage supplies all contact and audit readings.
 */
export function test_human_motion_law_touch_partner_cup_cheek(): void {
  TestValidator.equals(
    "cup-cheek satisfies its contact law",
    motionHumanLawTouch(
      "cup-cheek",
      {
        target: { kind: "person", subject: "b", region: "cheekLeft" },
        kind: "hold",
      },
      { facing: true, gap: 0.55, mirror: false },
    ),
    [],
  );
}
