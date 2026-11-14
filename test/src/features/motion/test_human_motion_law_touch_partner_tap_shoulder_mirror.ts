import { TestValidator } from "@nestia/e2e";

import { motionHumanLawTouchRows } from "../internal/motionHumanLawTouchRows";

/**
 * The touch `tap-shoulder` (two fingertip taps on the left shoulder of a partner facing the performer 0.55 m ahead) done with the left hand on the mirrored region is
 * the right-hand touch mirrored, on the displayed bones of two average men, the partner standing still: apart from
 * the row's other parts, so each spec runs within the time a test may take.
 *
 * Both films are read by `motionHumanLawTouch` (its `mirror` part).
 *
 * Scenarios:
 * 1. The left-hand film is the right-hand film mirrored in the median plane
 *    within 5 mm, read 4 times a second, and of the same duration.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law with each hand and compares displayed bones; a left hand that lays or travels otherwise than the right hand's mirror fails with its distance, second and bone.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the body's own mirror symmetry; nothing is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases One one-hand row, the mirror only; its siblings `test_human_motion_law_touch_partner_tap_shoulder` and `test_human_motion_law_touch_partner_tap_shoulder_*` read the row's other parts.
 * @evidence contracts/development/testing.md#execution-ownership In memory; two films read at 4 Hz; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the row, why it stands apart and the scenario with its bound.
 */
export function test_human_motion_law_touch_partner_tap_shoulder_mirror(): void {
  TestValidator.equals(
    "the left-hand tap-shoulder mirrors the right-hand one",
    motionHumanLawTouchRows.partner("tap-shoulder", "mirror"),
    [],
  );
}
