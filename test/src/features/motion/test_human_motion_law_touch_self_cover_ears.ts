import { TestValidator } from "@nestia/e2e";

import { motionHumanLawTouchRows } from "../internal/motionHumanLawTouchRows";

/**
 * The touch `cover-ears` (both ears pressed under the palms) moves as it
 * means to, on the displayed bones of the average man: every
 * expectation of the row read off its film.
 *
 * The row is read by `motionHumanLawTouch`, whose complaints are gathered
 * before the one assertion.
 *
 * Scenarios:
 * 1. No body part lies inside another by more than 10 mm at any frame of the
 *    film (the audit's tangle).
 * 2. Over each sixth of the film, which overlaps each neighbouring sixth by
 *    two frames, the audit's other checks are clean: no sunk
 *    collider, no slipping or lifted planted foot, no jump over 5 mm, no
 *    out-and-back over 50 mm, no joint faster than 30 m/s, balance kept.
 * 3. Neither elbow of the performer travels more than 80 mm in one 1/24 s
 *    frame.
 * 4. Each hand's skin is within 10 mm of its region at the arrival and at
 *    the leave.
 * 5. A pat or a tap comes down its count of times and lifts by half to the
 *    whole of its kind's lift.
 * 6. A stroke, a rub or a scratch stays on its region and moves on it by
 *    half to the whole of its travel.
 * 7. A press, a squeeze or a hold stays where it arrived within 10 mm.
 * 8. Each hand ends within 10 mm of where it began; an unused hand strays
 *    no more than 80 mm in the trunk's frame, and an arm whose own region is
 *    touched holds within 10 mm while it is touched.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law through the chain and reads displayed bones and colliders; a tangle, a slipping foot, a hand short of its region, a missing repetition, an elbow that flips fails with its measured number.
 * @evidence contracts/development/testing.md#independent-expectations Contact is the hand's collider on the region's point of the displayed body, the repetitions and amplitudes are the kind's definition, the audit's bounds hold for any human motion and the mirror is the body's own symmetry; none is read from the law's goals.
 * @evidence contracts/development/testing.md#distinguishing-cases One row of its family (`motionHumanLawTouchRows`); this spec owns the whole audit (its tangle and its six sixths), the film's own checks, which were split before over sibling specs on the same film; its siblings `test_human_motion_law_touch_self_*` hold the family's other rows.
 * @evidence contracts/development/testing.md#execution-ownership In memory; it performs the row's one film, and every check of a film reads that one film; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the row, the films it performs and the 8 scenarios with their bounds.
 */
export function test_human_motion_law_touch_self_cover_ears(): void {
  TestValidator.equals(
    "the cover-ears touch is right",
    motionHumanLawTouchRows.own("cover-ears"),
    [],
  );
}