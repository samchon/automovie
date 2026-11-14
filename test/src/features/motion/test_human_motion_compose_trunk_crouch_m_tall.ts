import { motionComposeTrunk } from "../internal/motionComposeTrunk";

/**
 * The trunk's crouch on the m-tall body: the hips sinking and the trunk inclining over them, the body standing again, the feet and the balance holding all the way (`motionComposeTrunk.crouch` states
 * the scenarios and their bounds). One spec per body of the sweep, so every
 * body is read and each runs alone in its time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the resolver's bones and the balance owner's measures for each written posture; a crouch that stays down, drags a planted foot or falls forward fails with its cell and numbers.
 * @evidence contracts/development/testing.md#independent-expectations The hips' place is the standing one lowered by the stated depth, the pitch is the stated degrees read between two bone axes, the plants are the standing ones and the balance is the centre of mass against the soles.
 * @evidence contracts/development/testing.md#distinguishing-cases Six crouches from none to deep with and without a pitch, both ends, both middles and the held span, a crouch from a standing posture of joint angles alone, refusals of each bad input, on one body of the sweep; the other bodies, the turn and the counterbalance are their own specs.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body, 49 solved postures and seven balance solves; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the phrase, the body, where the scenarios are stated and the split.
 */
export function test_human_motion_compose_trunk_crouch_m_tall(): void {
  motionComposeTrunk.crouch("m-tall");
}
