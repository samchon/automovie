import { TestValidator } from "@nestia/e2e";

import { motionHumanLawHandToFace } from "../internal/motionHumanLawHandToFace";

/**
 * The short sip supplies the remaining original build. The full bilateral vessel reflection is checked on drinking.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact geometry and its role in the task family.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the public task, measures elbow travel and displayed wrist arrival and return, and runs the whole-film body audit.
 * @evidence contracts/development/testing.md#independent-expectations The anatomical wrist-to-head bound uses the hand length and head height, with a 10 mm return tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases The short sip supplies the remaining original build. The full bilateral vessel reflection is checked on drinking.
 * @evidence contracts/development/testing.md#execution-ownership Every contact and audit observation of the original stage reads one shared film.
 */
export function test_human_motion_law_hand_to_face_sip(): void {
  TestValidator.equals(
    "the sip task is right",
    motionHumanLawHandToFace("sip", ["f-minus-one"], false),
    [],
  );
}
