import { motionRecomposeMutual } from "../internal/motionRecomposeMutual";

/**
 * A standing short and tall pair complete a toss beyond both sets of arms. A floor kick exercises the other ball action.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Checks the displayed pose and events of the public action.
 * @evidence contracts/development/testing.md#independent-expectations The two performers' event and geometry readings retain the bounds stated by motionRecomposeMutual.
 * @evidence contracts/development/testing.md#distinguishing-cases Ball transfer needs flight, a catch and a declared toss anchor. The kick starts with the ball on the floor.
 * @evidence contracts/development/testing.md#execution-ownership In memory on prepared human bodies, discovered by its public test name.
 * @evidence contracts/development/common.md#meaningful-documentation States the action branches and the properties checked.
 */
export function test_human_motion_recompose_mutual_f_small_m_tall_standing(): void {
  motionRecomposeMutual("f-small", "m-tall", "standing");
}
