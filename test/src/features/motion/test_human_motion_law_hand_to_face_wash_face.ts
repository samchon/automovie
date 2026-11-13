import { TestValidator } from "@nestia/e2e";

import { motionHumanLawHandToFace } from "../internal/motionHumanLawHandToFace";

/**
 * The hand-to-face task `washFace` moves the body as it means to and tangles
 * nothing, on the displayed bones of the average man: one task of the law's
 * table per spec, so each runs within the time a test may take.
 *
 * The task is performed from quiet standing and read by
 * `motionHumanLawHandToFace`, whose complaints are gathered before the one
 * assertion.
 *
 * Scenarios:
 * 1. The generic audit over the whole film is clean: no body part inside
 *    another by more than 10 mm, no sunk collider, no slipping or lifted
 *    planted foot, no jump over 5 mm, no out-and-back over 50 mm, balance
 *    kept.
 * 2. Neither elbow travels more than 80 mm in one 1/24 s frame.
 * 3. At the task's event the acting wrist is at the face (or, reading, the
 *    sheet's distance from the eyes).
 * 4. Both hands end within 10 mm of where they began.
 * 5. A one-hand task leaves the idle hand within 80 mm of its place; the
 *    two-hand wash keeps each elbow on its own side of the median plane.
 * 6. Drinking and sipping hold the cup's axis within 10 degrees of
 *    vertical at the mouth on four bodies of the population.
 * 7. Reading flexes the neck and head 33 to 45 degrees at the sheet.
 * 8. The left-hand task mirrors the right-hand task within 5 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law through the chain and reads displayed bones; an arm through the chest, an elbow that flips, a tilted cup or a hand that does not return fails with its measured number.
 * @evidence contracts/development/testing.md#independent-expectations Each bound is a physical requirement, a cited range or the mirror symmetry of the body, stated in the checker's document; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases One row of the law's table; its siblings `test_human_motion_law_hand_to_face_*` hold the others.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because fitting an arm on the body costs a second a frame, so the table is split one task per spec; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the task, why it stands alone and the 8 scenarios with their bounds.
 */
export function test_human_motion_law_hand_to_face_wash_face(): void {
  TestValidator.equals(
    "the washFace task is right",
    motionHumanLawHandToFace("washFace"),
    [],
  );
}
