import { TestValidator } from "@nestia/e2e";

import { motionHumanLawTouchRows } from "../internal/motionHumanLawTouchRows";

/**
 * The touch `slap-thigh` (the right thigh slapped once) tangles nothing, on the displayed bones of
 * the average man: the audit's tangle apart from the row's other parts, so each spec
 * runs within the time a test may take.
 *
 * The row is read by `motionHumanLawTouch` (its `tangle` part).
 *
 * Scenarios:
 * 1. No body part of anyone in the film lies inside another by more than
 *    10 mm at any frame.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law and audits the displayed film; an arm through the chest or a finger in a body fails with the pair, its depth and its second.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the audit's own, which holds for any human motion; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases One row and one part of its audit; its siblings `test_human_motion_law_touch_self_slap_thigh` and `test_human_motion_law_touch_self_slap_thigh_*` read the row's other parts.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because fitting an arm on a body costs up to a second a frame; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the row, why it stands apart and the scenario with its bound.
 */
export function test_human_motion_law_touch_self_slap_thigh_tangle(): void {
  TestValidator.equals(
    "the slap-thigh touch tangles nothing",
    motionHumanLawTouchRows.own("slap-thigh", "tangle"),
    [],
  );
}
