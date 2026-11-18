import { motionRecomposeMutual } from "../internal/motionRecomposeMutual";

/**
 * The original seated pair holds its seat through contact and prop handling. The handshake also replays when only the same seed is used.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Checks the displayed pose and events of the public action.
 * @evidence contracts/development/testing.md#independent-expectations The two performers' event and geometry readings retain the bounds stated by motionRecomposeMutual.
 * @evidence contracts/development/testing.md#distinguishing-cases The seated base holds the pelvis while roles clasp, hand over a mug and meet at the cheek. Pickup tests both a mug handle and a ball grasp.
 * @evidence contracts/development/testing.md#execution-ownership In memory on prepared human bodies, discovered by its public test name.
 * @evidence contracts/development/common.md#meaningful-documentation States the action branches and the properties checked.
 */
export function test_human_motion_recompose_mutual_m_average_f_small_seated(): void {
  motionRecomposeMutual("m-average", "f-small", "seated");
}
