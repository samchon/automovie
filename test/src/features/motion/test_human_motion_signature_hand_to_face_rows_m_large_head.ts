import { motionHandToFaceRows } from "../internal/motionHandToFaceRows";

/**
 * Phone, combing and washing are constrained by the large actor's elbow, upright trunk and head posture. Explicit left and right rows exercise both hand choices.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Checks the displayed pose and events of the public action.
 * @evidence contracts/development/testing.md#independent-expectations The displayed joint angles retain the van Andel et al. elbow bound and the provisional head and trunk bounds stated by motionHandToFaceRows.
 * @evidence contracts/development/testing.md#distinguishing-cases Ear, hair and face targets and both explicit sides exercise distinct path or handedness branches.
 * @evidence contracts/development/testing.md#execution-ownership In memory on prepared human bodies, discovered by its public test name.
 * @evidence contracts/development/common.md#meaningful-documentation States the action branches and the properties checked.
 */
export function test_human_motion_signature_hand_to_face_rows_m_large_head(): void {
  motionHandToFaceRows.check("m-large", motionHandToFaceRows.HEAD);
}
