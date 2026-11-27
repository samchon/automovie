import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/**
 * Whether an arm is the last limb a posture's solve fits and fits alone: the
 * other arm has no goal and no leg's goal rides a bone of this arm.
 *
 * The posture's solve fits the legs first and the arms after them, so under
 * this condition nothing is fitted after this arm and nothing fitted before it
 * reads it. The rest of the body is then the same whatever this arm's goal, and
 * fitting the arm alone on the posture's pose without it gives the arm the
 * posture's own solve gives. A search over one posture poses that base once and
 * fits each candidate's arm on it.
 *
 * @param limbs The posture's limb goals; this arm's own goal is not read.
 * @param side The arm.
 * @returns Whether the arm fits last and alone.
 */
export function isHumanArmAlone(
  limbs: IAutoMovieMotionHumanPosture["limbs"],
  side: AutoMovieHumanSide,
): boolean {
  const other: IsHumanArmAloneOther = side === "left" ? "rightArm" : "leftArm";
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

/** The alternatives of `IsHumanArmAloneOther`'s site. */
type IsHumanArmAloneOther = "leftArm" | "rightArm";
