import { motionHandToFaceRows } from "../internal/motionHandToFaceRows";

/**
 * Bringing a hand to the face looks like the activity of daily living it
 * is, on the f-small body, for the tasks at the ear and the head and both hands of the default task
 * (`motionHandToFaceRows` states the rows, the bounds and their sources).
 * One spec per extreme body and half of the rows, so every row is read on
 * every body and each runs alone in its time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law on a real body and reads displayed joints; a hand brought to the face on a straight arm, a head craned up to meet it or a body leaning far fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The elbow's range is van Andel et al.'s; the other limits are marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases The rows of `motionHandToFaceRows.HEAD` on one extreme body; the other half of the rows and the other bodies are their own specs.
 * @evidence contracts/development/testing.md#execution-ownership In memory, one film per row; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the law, the body, the rows, where the bounds are stated and the split.
 */
export function test_human_motion_signature_hand_to_face_rows_f_small_head(): void {
  motionHandToFaceRows.check("f-small", motionHandToFaceRows.HEAD);
}
