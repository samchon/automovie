import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
} from "@automovie/interface";

/**
 * Bone frames whose colliders the forearm clearance reads: the trunk and both
 * whole legs, the segments the tangle audit reads an arm against, plus each
 * already placed arm's three segments.
 */
export function HumanArmObstacleBones(
  arms: readonly AutoMovieHumanSide[] = [],
): ReadonlySet<AutoMovieHumanoidBone> {
  let mask: number = 0;
  for (const side of arms) {
    if (side === "left") mask |= 1;
    else if (side === "right") mask |= 2;
  }
  return SETS[mask]!;
}

/** The existing trunk-only clearance membership, shared with obstacle demand. */
export namespace HumanArmObstacleBones {
  /**
   * Original axial collider names; leave this shared set unchanged.
   *
   * Defines the borrowed canonical trunk names shared by trunk filtering and
   * obstacle demand.
   */
  export const TRUNK: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([
      "hips",
      "spine",
      "chest",
      "upperChest",
      "neck",
      "head",
    ]);
}

/**
 * Both legs' segments, whole: the tangle audit reads an arm against every
 * segment of the body, so a fit that clears only the thighs lays a hand's
 * digits in a shank or a foot the audit refuses.
 */
const LEGS: readonly AutoMovieHumanoidBone[] = [
  "leftUpperLeg",
  "rightUpperLeg",
  "leftLowerLeg",
  "rightLowerLeg",
  "leftFoot",
  "rightFoot",
  "leftToes",
  "rightToes",
];

/** Four fixed membership subsets; actual placement retains profile order. */
const SETS: readonly ReadonlySet<AutoMovieHumanoidBone>[] = Array.from(
  { length: 4 },
  (_: unknown, mask: number): ReadonlySet<AutoMovieHumanoidBone> =>
    new Set<AutoMovieHumanoidBone>([
      ...HumanArmObstacleBones.TRUNK,
      ...LEGS,
      ...((mask & 1) === 0
        ? []
        : (["leftUpperArm", "leftLowerArm", "leftHand"] as const)),
      ...((mask & 2) === 0
        ? []
        : (["rightUpperArm", "rightLowerArm", "rightHand"] as const)),
    ]),
);
