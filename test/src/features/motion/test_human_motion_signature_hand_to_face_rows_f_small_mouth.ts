import { motionHandToFaceRows } from "../internal/motionHandToFaceRows";

/**
 * Eating, biting and wiping the mouth bring the small actor's hand to the mouth within the sustained stroke's elbow, head and trunk bounds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Checks the displayed pose and events of the public action.
 * @evidence contracts/development/testing.md#independent-expectations The displayed joint angles retain the van Andel et al. elbow bound and the provisional head and trunk bounds stated by motionHandToFaceRows.
 * @evidence contracts/development/testing.md#distinguishing-cases The mouth actions exercise an eating motion, a bite and a wipe. The drinking test covers drink and sip with the same bounds.
 * @evidence contracts/development/testing.md#execution-ownership In memory on prepared human bodies, discovered by its public test name.
 * @evidence contracts/development/common.md#meaningful-documentation States the action branches and the properties checked.
 */
export function test_human_motion_signature_hand_to_face_rows_f_small_mouth(): void {
  motionHandToFaceRows.check("f-small", motionHandToFaceRows.MOUTH);
}
