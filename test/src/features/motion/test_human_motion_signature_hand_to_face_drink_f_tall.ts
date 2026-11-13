import { motionHandToFaceDrink } from "../internal/motionHandToFaceDrink";

/**
 * A glass is brought to the lips as people drink from one, on the f-tall
 * body: a drink and a sip with the implied glass, and a drink from a real
 * glass taken up for that use first, each read at `atMouth` against Murphy,
 * Willén and Sunnerhagen 2011 (`motionHandToFaceDrink` states the bounds and
 * the scene). One spec per extreme body, so each runs alone in its time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law on a real body, with the implied glass and with a real one taken up first, and reads displayed joints; a raised elbow, a wrist off the mouth or a cell that does not plan fails with its values and the arm goal it came from.
 * @evidence contracts/development/testing.md#independent-expectations The posture is Murphy et al.'s; the limits are marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases A drink, a sip and a drink from a held glass on one extreme body; the other three bodies are their own specs.
 * @evidence contracts/development/testing.md#execution-ownership In memory, three films; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the body, the cells, where the bound and its source are stated, and the split.
 */
export function test_human_motion_signature_hand_to_face_drink_f_tall(): void {
  motionHandToFaceDrink.check("f-tall", false);
}
