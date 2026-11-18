import { TestValidator } from "@nestia/e2e";

import { motionHumanLawTouch } from "../internal/motionHumanLawTouch";

/**
 * The palm travels behind the head along the nape without crossing its collider.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the acting hand, surface and motion under test.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the public touch and measures contact, elbow travel, return and the performer's physical audit.
 * @evidence contracts/development/testing.md#independent-expectations Hand colliders must meet the displayed skin within 10 mm at arrival and release. Elbows travel at most 80 mm per 24 Hz frame.
 * @evidence contracts/development/testing.md#distinguishing-cases Bilateral reflection of the displayed bones is measured at 4 Hz within 5 mm.
 * @evidence contracts/development/testing.md#execution-ownership The original stage supplies all contact and audit readings.
 */
export function test_human_motion_law_touch_self_rub_nape(): void {
  TestValidator.equals(
    "rub-nape satisfies its contact law",
    motionHumanLawTouch("rub-nape", {
      target: { kind: "self", region: "nape" },
      kind: "rub",
    }),
    [],
  );
}
