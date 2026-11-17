import { TestValidator } from "@nestia/e2e";

import { motionHumanLawTouchRows } from "../internal/motionHumanLawTouchRows";

/**
 * The touch `rub-nape` (the nape rubbed with the palm) moves as it means to, on the displayed bones of
 * the average man: the row's own expectations apart from its audit and its mirror, so
 * each spec runs within the time a test may take.
 *
 * The row is read by `motionHumanLawTouch` (its `film` part), whose
 * complaints are gathered before the one assertion.
 *
 * Scenarios:
 * 1. Neither elbow of the performer travels more than 80 mm in one 1/24 s
 *    frame.
 * 2. Each hand's skin is within 10 mm of its region at the arrival and at
 *    the leave.
 * 3. A pat or a tap comes down its count of times and lifts by half to the
 *    whole of its kind's lift.
 * 4. A stroke, a rub or a scratch stays on its region and moves on it by
 *    half to the whole of its travel.
 * 5. A press, a squeeze or a hold stays where it arrived within 10 mm.
 * 6. Each hand ends within 10 mm of where it began; an unused hand strays
 *    no more than 80 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law through the chain and reads displayed bones and colliders; a hand short of its region, a missing repetition or an elbow that flips fails with its measured number.
 * @evidence contracts/development/testing.md#independent-expectations Contact is the hand's collider on the region's point of the displayed body, and the repetitions and amplitudes are the kind's definition; none is read from the law's goals.
 * @evidence contracts/development/testing.md#distinguishing-cases One row of its family (`motionHumanLawTouchRows`), one part; its siblings `test_human_motion_law_touch_self_rub_nape` and `test_human_motion_law_touch_self_rub_nape_*` read the row's other parts.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because fitting an arm on a body costs up to a second a frame, so the family is split one row and one part per spec; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the row, why it stands alone and the 6 scenarios with their bounds.
 */
export function test_human_motion_law_touch_self_rub_nape(): void {
  TestValidator.equals(
    "the rub-nape touch is right",
    motionHumanLawTouchRows.own("rub-nape", "film"),
    [],
  );
}
