import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { HumanHand } from "./HumanHand";
import type { IHumanPosture } from "./IHumanPosture";

/**
 * Whether an arm is the last limb a posture's solve fits and fits alone:
 * the other arm has no goal and no leg's goal rides a bone of this arm.
 *
 * The posture's solve fits the legs first and the arms after them, so under
 * this condition nothing is fitted after this arm and nothing fitted before
 * it reads it. The rest of the body is then the same whatever this arm's
 * goal, and fitting the arm alone on the posture's pose without it gives
 * the arm the posture's own solve gives. A search over one posture poses
 * that base once and fits each candidate's arm on it.
 *
 * @param limbs The posture's limb goals; this arm's own goal is not read.
 * @param side The arm.
 * @returns Whether the arm fits last and alone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the condition, why it makes the arm's fit independent of the rest and what a caller does with it.
 * @evidence contracts/development/implementation.md#principled-implementation The two ways another limb's fit couples with this arm's: an arm fitted with it (the pair) and a goal attached to one of its bones; both are read off the goals.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One test of the other arm and one scan of the two legs' attachments.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bone names tested are the arm chain's and its hand's digits, by side; no law or body is named. Digit goals are not read: a caller that reads the fitted digits, not the arm alone, solves the posture.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The one statement of the condition, shared by the drinking arm's search and the hand-to-face law's reach time.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function isHumanArmAlone(
  limbs: IHumanPosture["limbs"],
  side: HumanHand.Side,
): boolean {
  const other: "leftArm" | "rightArm" = side === "left" ? "rightArm" : "leftArm";
  if (limbs[other] !== undefined) return false;
  for (const name of ["leftLeg", "rightLeg"] as const) {
    const on: AutoMovieHumanoidBone | undefined = limbs[name]?.on;
    if (
      on !== undefined &&
      on.startsWith(side) &&
      /(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/.test(on)
    )
      return false;
  }
  return true;
}
