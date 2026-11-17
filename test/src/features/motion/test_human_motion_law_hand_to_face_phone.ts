import { TestValidator } from "@nestia/e2e";

import { motionHumanLawHandToFace } from "../internal/motionHumanLawHandToFace";

/**
 * The hand-to-face task `phone` moves the body as it means to, on the
 * displayed bones of the average man: one task of the law's table, every
 * expectation of the task read off one right-hand film.
 *
 * The task is performed from quiet standing and read by
 * `motionHumanLawHandToFace`, whose complaints are gathered before the one
 * assertion.
 *
 * Scenarios:
 * 1. No body part lies inside another by more than 10 mm at any frame of the
 *    film (the audit's tangle).
 * 2. Over each sixth of the film, which overlaps each neighbouring sixth by
 *    two frames, the audit's other checks are clean: no sunk collider, no
 *    slipping or lifted planted foot, no jump over 5 mm, no out-and-back
 *    over 50 mm, no joint faster than 30 m/s, balance kept.
 * 3. Neither elbow travels more than 80 mm in one 1/24 s frame.
 * 4. At the task's event the acting wrist is within a hand's length plus the
 *    head's height of the head's joint.
 * 5. Both hands end within 10 mm of where they began.
 * 6. The idle hand stays within 80 mm of its place.
 * 7. The left-hand film is the right-hand film mirrored in the median plane
 *    within 5 mm, read 4 times a second, and of the same duration.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law through the chain and reads displayed bones; a tangle, a slipping foot, an elbow that flips, a hand short of the face, a hand that does not return or a left hand that is not the right hand's mirror fails with its measured number.
 * @evidence contracts/development/testing.md#independent-expectations Each bound is the audit's own, a physical requirement, a cited range or the body's mirror symmetry, stated in the checker's document; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases One row of the law's table; this spec owns the whole audit (its tangle and its six sixths), the film's own checks and the left-hand mirror, which were split before over sibling specs on the same film; its siblings `test_human_motion_law_hand_to_face_*` hold the other rows.
 * @evidence contracts/development/testing.md#execution-ownership In memory; it performs the right-hand film and the left-hand film of the mirror, and every check of a film reads that one film; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the task, the films it performs and the 7 scenarios with their bounds.
 */
export function test_human_motion_law_hand_to_face_phone(): void {
  TestValidator.equals(
    "the phone task is right",
    motionHumanLawHandToFace("phone"),
    [],
  );
}