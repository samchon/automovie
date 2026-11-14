import { TestValidator } from "@nestia/e2e";

import { motionHumanLawHandToFace } from "../internal/motionHumanLawHandToFace";

/**
 * The hand-to-face task `comb` moves the body as it means to, on the
 * displayed bones of the average man: one task of the law's table per spec,
 * and the right-hand film's own expectations apart from its audit, the
 * population's and the mirror's, so each runs within the time a test may
 * take.
 *
 * The task is performed from quiet standing and read by
 * `motionHumanLawHandToFace` (its `film` part), whose complaints are
 * gathered before the one assertion.
 *
 * Scenarios:
 * 1. Neither elbow travels more than 80 mm in one 1/24 s frame.
 * 2. At the task's event the acting wrist is at the face (or, reading, the
 *    sheet's distance from the eyes).
 * 3. Both hands end within 10 mm of where they began.
 * 4. A one-hand task leaves the idle hand within 80 mm of its place; the
 *    two-hand wash keeps each elbow on its own side of the median plane.
 * 5. Reading flexes the neck and head 33 to 45 degrees at the sheet.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law through the chain and reads displayed bones; an elbow that flips, a hand short of the face or a hand that does not return fails with its measured number.
 * @evidence contracts/development/testing.md#independent-expectations Each bound is a physical requirement or a cited range, stated in the checker's document; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases One row of the law's table; its siblings `test_human_motion_law_hand_to_face_*` hold the others, and the `_tangle`, `_motion_1` to `_motion_6`, `_mirror` and `_population` specs this row's other expectations.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because fitting an arm on the body costs a second a frame, so the table is split one task and one part per spec; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the task, why it stands alone and the 5 scenarios with their bounds.
 */
export function test_human_motion_law_hand_to_face_comb(): void {
  TestValidator.equals(
    "the comb task is right",
    motionHumanLawHandToFace("comb", "film"),
    [],
  );
}
