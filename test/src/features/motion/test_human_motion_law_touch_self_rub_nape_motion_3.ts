import { TestValidator } from "@nestia/e2e";

import { motionHumanLawTouchRows } from "../internal/motionHumanLawTouchRows";

/**
 * The touch `rub-nape` (the nape rubbed with the palm) moves continuously and stands as it should over
 * the third sixth of its film, on the displayed bones of the average man: the audit's
 * checks other than the tangle over one sixth, apart from the row's other
 * parts, so each spec runs within the time a test may take.
 *
 * The row is read by `motionHumanLawTouch` (its `motion-3` part).
 *
 * Scenarios:
 * 1. Over the third sixth of the film, which overlaps each neighbouring sixth
 *    by two frames, the generic audit's other checks are clean for everyone
 *    in it: no sunk collider, no slipping or lifted planted foot, no jump
 *    over 5 mm, no out-and-back over 50 mm, no joint faster than 30 m/s,
 *    balance kept.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law and audits the displayed film; a step of a joint, a reversal, a slipping foot or a lost balance fails with the finding's place.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the audit's own, which hold for any human motion; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases One row and one sixth of its audit's other checks; its siblings `test_human_motion_law_touch_self_rub_nape` and `test_human_motion_law_touch_self_rub_nape_*` read the row's other parts.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because fitting an arm on a body costs up to a second a frame, so the audit's other checks are split by the film's sixths; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the row, the sixth, why it stands apart and the scenario with its bounds.
 */
export function test_human_motion_law_touch_self_rub_nape_motion_3(): void {
  TestValidator.equals(
    "the rub-nape touch passes the audit's other checks over the third sixth",
    motionHumanLawTouchRows.own("rub-nape", "motion-3"),
    [],
  );
}
