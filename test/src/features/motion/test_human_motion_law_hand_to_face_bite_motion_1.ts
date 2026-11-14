import { TestValidator } from "@nestia/e2e";

import { motionHumanLawHandToFace } from "../internal/motionHumanLawHandToFace";

/**
 * The hand-to-face task `bite` moves continuously and stands as it should, on the displayed bones of the
 * average man: the audit's checks other than the tangle over the first sixth of the right-hand film, apart from its other
 * expectations (`test_human_motion_law_hand_to_face_bite` and its
 * `_tangle`, `_motion_1` to `_motion_6`, `_mirror` and `_population` siblings), so each runs
 * within the time a test may take.
 *
 * The task is performed from quiet standing and read by
 * `motionHumanLawHandToFace` (its `motion-1` part).
 *
 * Scenarios:
 * 1. The generic audit's other checks over the first sixth of the film, which
 *    overlaps each neighbouring sixth by two frames, are clean: no sunk
 *    collider, no slipping or lifted planted foot, no jump over 5 mm, no
 *    out-and-back over 50 mm, no joint faster than 30 m/s, balance kept.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law through the chain and audits the displayed film; a step of a joint, a reversal, a slipping foot or a lost balance fails with the finding's place.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the audit's own, which hold for any human motion; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases One row of the law's table and one part of its audit; the sibling specs read the rest.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because fitting an arm on the body costs a second a frame, so the audit is split by its checks and its other checks by the film's sixths; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the task, why it stands apart and the scenario with its bounds.
 */
export function test_human_motion_law_hand_to_face_bite_motion_1(): void {
  TestValidator.equals(
    "the bite task passes the audit's other checks over the first sixth",
    motionHumanLawHandToFace("bite", "motion-1"),
    [],
  );
}
