import { handToFace } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanLawHandToFace } from "../internal/motionHumanLawHandToFace";

/**
 * Every hand-to-face task moves the body as it means to and tangles
 * nothing, on the displayed bones of the average man.
 *
 * Each task of the law's table (drink, sip, eat, bite, phone, read,
 * brushTeeth, comb, washFace, wipeMouth) is performed from quiet standing
 * and read by `motionHumanLawHandToFace`, whose complaints are gathered
 * over every task before the one assertion, so a failing task does not
 * hide the others.
 *
 * Scenarios, per task:
 * 1. The generic audit over the whole film is clean: no body part inside
 *    another by more than 10 mm, no sunk collider, no slipping or lifted
 *    planted foot, no jump over 5 mm, no out-and-back over 50 mm, balance
 *    kept.
 * 2. Neither elbow travels more than 80 mm in one 1/24 s frame.
 * 3. At the task's event the acting wrist is at the face (or, reading, the
 *    sheet's distance from the eyes).
 * 4. Both hands end within 10 mm of where they began.
 * 5. A one-hand task leaves the idle hand within 80 mm of its place; the
 *    two-hand wash keeps each elbow on its own side of the median plane.
 * 6. Drinking and sipping hold the cup's axis within 10 degrees of
 *    vertical at the mouth on four bodies of the population.
 * 7. Reading flexes the neck and head 33 to 45 degrees at the sheet.
 * 8. The left-hand task mirrors the right-hand task within 5 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law through the chain and reads displayed bones; an arm through the chest, an elbow that flips, a tilted cup or a hand that does not return fails with its measured number.
 * @evidence contracts/development/testing.md#independent-expectations Each bound is a physical requirement, a cited range or the mirror symmetry of the body, stated in the checker's document; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases Every row of the law's table: holds and strokes, one hand and two, a region on the face and a sheet in the air.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because fitting an arm on the body costs a second a frame; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States how the complaints are gathered and lists the 8 scenarios with their bounds.
 */
export function test_human_motion_law_hand_to_face(): void {
  const complaints: string[] = [];
  for (const task of Object.keys(handToFace.ROWS) as handToFace.Task[])
    complaints.push(...motionHumanLawHandToFace(task));
  TestValidator.equals("every hand-to-face task is right", complaints, []);
}
