import { TestValidator } from "@nestia/e2e";

import { motionHumanLawHandToFace } from "../internal/motionHumanLawHandToFace";

/**
 * The hand-to-face task `comb` done with the left hand is the right-hand
 * task mirrored, on the displayed bones of the average man: the mirror apart
 * from the right-hand film's own expectations
 * (`test_human_motion_law_hand_to_face_comb`), so each runs within the time a
 * test may take.
 *
 * Both films are performed from quiet standing and read by
 * `motionHumanLawHandToFace` (its `mirror` part).
 *
 * Scenarios:
 * 1. The left-hand film is the right-hand film mirrored in the median plane
 *    within 5 mm, read 4 times a second, and of the same duration.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law with each hand through the chain and compares displayed bones; a left hand that lays or travels otherwise than the right hand's mirror fails with its distance, second and bone.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the body's own mirror symmetry; nothing is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases One row of the law's table, the mirror only; its film spec reads the rest.
 * @evidence contracts/development/testing.md#execution-ownership In memory; two films read at 4 Hz; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the task, why it stands apart and the scenario with its bound.
 */
export function test_human_motion_law_hand_to_face_comb_mirror(): void {
  TestValidator.equals(
    "the left-hand comb mirrors the right-hand one",
    motionHumanLawHandToFace("comb", "mirror"),
    [],
  );
}
