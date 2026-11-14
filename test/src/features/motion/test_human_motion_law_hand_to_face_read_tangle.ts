import { TestValidator } from "@nestia/e2e";

import { motionHumanLawHandToFace } from "../internal/motionHumanLawHandToFace";

/**
 * The hand-to-face task `read` tangles nothing, on the displayed bones of the
 * average man: the tangle check of the right-hand film, apart from its other
 * expectations (`test_human_motion_law_hand_to_face_read` and its
 * `_tangle`, `_motion_1` to `_motion_6`, `_mirror` and `_population` siblings), so each runs
 * within the time a test may take.
 *
 * The task is performed from quiet standing and read by
 * `motionHumanLawHandToFace` (its `tangle` part).
 *
 * Scenarios:
 * 1. No body part lies inside another by more than 10 mm at any frame of the
 *    film.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law through the chain and audits the displayed film; an arm through the chest or a finger in the thigh fails with the pair, its depth and its second.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the audit's own, which hold for any human motion; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases One row of the law's table and one part of its audit; the sibling specs read the rest.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because fitting an arm on the body costs a second a frame, so the audit is split by its checks; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the task, why it stands apart and the scenario with its bounds.
 */
export function test_human_motion_law_hand_to_face_read_tangle(): void {
  TestValidator.equals(
    "the read task passes the audit's tangle checks",
    motionHumanLawHandToFace("read", "tangle"),
    [],
  );
}
