import { motionComposeTrunk } from "../internal/motionComposeTrunk";

/**
 * A turn of the trunk on the pelvis and a posture sunk into its knees on the m-short body: the chest turned by a turn and the spine by its share, the pelvis left, the hips of a sunk posture where asked, the chest inclined and both feet on their plants (`motionComposeTrunk.turnAndSink` states
 * the scenarios and their bounds). One spec per body of the sweep, so every
 * body is read and each runs alone in its time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the resolver's bones for each written posture; a turn that moves the pelvis or a sink that drags a planted foot fails with its cell and numbers.
 * @evidence contracts/development/testing.md#independent-expectations The hips' place is the standing one moved by the stated distances, the angles are the stated degrees read between two bone axes, and the plants are the standing ones.
 * @evidence contracts/development/testing.md#distinguishing-cases Both turn directions, two depths against three inclinations with and without a backward move at two headings, on one body of the sweep; the other bodies, the crouch and the counterbalance are their own specs.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body, 34 solved postures; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the phrase, the body, where the scenarios are stated and the split.
 */
export function test_human_motion_compose_trunk_turn_m_short(): void {
  motionComposeTrunk.turnAndSink("m-short");
}
