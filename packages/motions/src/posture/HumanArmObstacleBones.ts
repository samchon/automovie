import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Bone frames whose colliders the forearm clearance reads: the trunk and
 * both whole legs, the segments the tangle audit reads an arm against,
 * plus each already placed arm's three segments.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the shared six-name TRUNK set, the trunk and whole-leg policy the audit reads, placed-arm membership and borrowed read-only names used by trunk filtering and obstacle FK demand.
 * @evidence contracts/development/implementation.md#principled-implementation Converts the existing clearance membership predicate into one canonical bone set, so scoped FK supplies exactly the same collider frames before actual placement/querying.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner supplies both the existing obstacle filter and its FK demand; TRUNK separately serves the trunk-only filter without duplicating the name table.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no collider, approximation, result, margin or contact policy; obstacle filtering still preserves original placed segment order.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two side labels select one of four fixed read-only sets in constant work, replacing repeated temporary arm-name sets.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Canonical membership depends only on the four possible placed-arm subsets, independent of body dimensions and current pose; actual geometry and queries remain current.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns four bounded static name sets and one trunk set, retaining no body, pose, shape or query history; callers borrow them without mutation.
 */
export function HumanArmObstacleBones(
  arms: readonly ("left" | "right")[] = [],
): ReadonlySet<AutoMovieHumanoidBone> {
  let mask: number = 0;
  for (const side of arms) {
    if (side === "left") mask |= 1;
    else if (side === "right") mask |= 2;
  }
  return SETS[mask]!;
}

/**
 * The existing trunk-only clearance membership, shared with obstacle demand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines canonical name metadata and borrowed immutable use.
 * @evidence contracts/development/design.md#principled-representation The original six axial collider-bearing bones carry forearm trunk obstacles.
 * @evidence contracts/development/design.md#minimal-and-owned-surface TRUNK serves HumanArmClearance.trunk and the thigh/placed-arm superset owner together.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains names only, without a posed frame, bounding approximation or distance answer.
 */
export namespace HumanArmObstacleBones {
  /**
   * Original axial collider names; leave this shared set unchanged.
   *
   * Defines the borrowed canonical trunk names shared by trunk filtering and obstacle demand.
   */
  export const TRUNK: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
    "hips", "spine", "chest", "upperChest", "neck", "head",
  ]);
}

/**
 * Both legs' segments, whole: the tangle audit reads an arm against every
 * segment of the body, so a fit that clears only the thighs lays a hand's
 * digits in a shank or a foot the audit refuses.
 */
const LEGS: readonly AutoMovieHumanoidBone[] = [
  "leftUpperLeg", "rightUpperLeg",
  "leftLowerLeg", "rightLowerLeg",
  "leftFoot", "rightFoot",
  "leftToes", "rightToes",
];

/** Four fixed membership subsets; actual placement retains profile order. */
const SETS: readonly ReadonlySet<AutoMovieHumanoidBone>[] = Array.from(
  { length: 4 },
  (_: unknown, mask: number): ReadonlySet<AutoMovieHumanoidBone> => new Set<AutoMovieHumanoidBone>([
    ...HumanArmObstacleBones.TRUNK,
    ...LEGS,
    ...((mask & 1) === 0 ? [] : ["leftUpperArm", "leftLowerArm", "leftHand"] as const),
    ...((mask & 2) === 0 ? [] : ["rightUpperArm", "rightLowerArm", "rightHand"] as const),
  ]),
);
