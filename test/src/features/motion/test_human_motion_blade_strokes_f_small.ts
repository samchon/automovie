import { TestValidator } from "@nestia/e2e";

import { motionBladeStrokes } from "../internal/motionBladeStrokes";

/**
 * A blade is the effector of blade work: the sword's own point and edge, as
 * the hand holds them, are what a thrust, a lunge and a cut bring onto the
 * target, on any body.
 *
 * The bounds are the motion campaign's: a contact lies within 15 mm of its
 * target at its event, and a planted foot slips at most 5 mm. The lunge's
 * length is provisional: fencing studies report the leading foot's travel,
 * and none was read, so the band is a wide one about half the stature (0.35
 * to 0.55), above a walking step's 0.41 only at its upper half.
 *
 * Scenarios, on the small woman, read by `motionBladeStrokes` (the opposite
 * build has its own spec). It takes an arming sword that lies point ahead
 * by its grip, for use on the oblique line, once (taking a tool for a use is
 * the costly part of the film), then makes four strokes in one film at four
 * pells, each read at its own decisive instant, so one film holds every
 * claim:
 * 1. A thrust at a pell ahead: the sword's point is within 15 mm of the
 *    pell's target, and neither foot has left its place (5 mm).
 * 2. The same thrust at a pell 0.1 m to the side of the first: its point
 *    lands 0.1 m to the side of where the first landed, within 15 mm.
 * 3. A descending diagonal cut at a pell 25 degrees to the left, the sword's
 *    cut law itself (`HumanSword.cut`), since the lexicon's `cut` row fixes a
 *    cut from straight above: the pell's target is within 15 mm of the blade
 *    between guard and point, and over the frame before, the blade's landing
 *    part comes down more than 50 mm.
 * 4. A lunge at a pell 25 degrees to the right, farther than the thrust's
 *    by 0.45 of the stature, the middle of the band a lunge's leading foot
 *    travels (a pell only a quarter of the stature farther leaves a lunge's
 *    hand at a third of the arm from the shoulder, which is a step's
 *    distance and was refused): the point is within 15 mm of the target, the
 *    leading foot has travelled 0.35 to 0.55 of the stature, and at the end
 *    it is back within 5 mm of where it stood.
 * 5. With the bare hand, a thrust at a point 3 m ahead, beyond the longest
 *    advance, is refused on the reach with a feasible maximum under 1 m.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public chain, props and input and reads the displayed sword and feet; a point or an edge off its target, a foot that slides, a lunge that does not travel or a silent miss fails.
 * @evidence contracts/development/testing.md#independent-expectations Each target is a pell's own declared contact placed in the world by the test; the bounds are the campaign's contact and slip bounds; the lunge band is stated provisional with what would source it. A wrong law lands the point elsewhere, which the distance catches; the test cannot tell a right landing reached by an ugly arm, which the verdict net owns.
 * @evidence contracts/development/testing.md#distinguishing-cases A thrust, a moved target, a cut and a lunge on three bearings; an unreachable target; this spec and its sibling on the opposite build, which is what a blade's fixed length against a varying arm is sensitive to. Skill and seed are the blade skill test's, two blades meeting the exchange test's.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds one film and one refused plan, under a minute alone; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the bounds with their sources, why one film a body is enough and the 5 scenarios.
 */
export function test_human_motion_blade_strokes_f_small(): void {
  TestValidator.equals(
    "the blade meets its target",
    motionBladeStrokes("f-small"),
    [],
  );
}
