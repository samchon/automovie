import type {
  prepareChainConstants,
  prepareSkeletonPoseResolution,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanLimbReads,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { HumanArmObstacleBones } from "./HumanArmObstacleBones";

/** The alternatives of `HumanLimbReadsReadObstacles`'s site. */
type HumanLimbReadsReadObstacles =
  | ReadonlySet<AutoMovieHumanoidBone>
  | readonly AutoMovieHumanoidBone[];

/**
 * What each limb's fit reads of a pose, read once off the rig: per limb and per
 * whether the other arm is already placed (an arm's obstacles include it then),
 * the bones whose records a fit's reduced pose keeps (`HumanLimbView.of`: the
 * obstacles, the limb's own bones and every ancestor of them) and the bone
 * demand of its authored read (the obstacles, the chain's effector and its
 * root's parent: `HumanLimbFit`'s source read), for a goal attached to no bone.
 * Both are functions of the rig and the limb alone; a fit whose goal is
 * attached adds that bone to its own copies.
 *
 * @param skeleton The rig.
 * @param resolution Its FK producer, which prepares the bound demands.
 * @param chains Its limbs' chain constants (`IHumanBody.chains`), for each
 *   chain's root's parent.
 * @returns The reads, by limb, then by `0` (the other arm not placed) and `1`
 *   (placed); a leg's two are alike.
 */
export function humanLimbReads(
  skeleton: IAutoMovieSkeleton,
  resolution: prepareSkeletonPoseResolution.IRig,
  chains: Readonly<
    Partial<Record<AutoMovieHumanLimb, prepareChainConstants.IConstants>>
  >,
): humanLimbReads.IReads {
  const parents: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null> =
    new Map();
  for (const bone of skeleton.bones as readonly IAutoMovieBone[])
    if (!parents.has(bone.bone)) parents.set(bone.bone, bone.parent);
  const read = (
    limb: AutoMovieHumanLimb,
    placed: boolean,
  ): humanLimbReads.IRead => {
    const side: AutoMovieHumanSide = limb.startsWith("left") ? "left" : "right";
    const arm: boolean = limb.endsWith("Arm");
    const others: AutoMovieHumanSide[] = placed
      ? [side === "left" ? "right" : "left"]
      : [];
    const obstacles: HumanLimbReadsReadObstacles = arm
      ? HumanArmObstacleBones(others)
      : [];

    // The view's bones: the obstacles and the limb's own, closed under
    // parents as `HumanLimbView.of` climbs them.
    const bones: Set<AutoMovieHumanoidBone> = new Set(obstacles);
    for (const part of arm
      ? (["UpperArm", "LowerArm", "Hand"] as const)
      : (["UpperLeg", "LowerLeg", "Foot", "Toes"] as const))
      bones.add(`${side}${part}`);
    for (const bone of [...bones])
      for (
        let parent: AutoMovieHumanoidBone | null | undefined =
          parents.get(bone);
        parent !== null && parent !== undefined && !bones.has(parent);
        parent = parents.get(parent)
      )
        bones.add(parent);

    // The source read's bones: the obstacles, the effector, and the chain
    // root's parent where it has one.
    const requested: Set<AutoMovieHumanoidBone> = new Set(obstacles);
    requested.add(`${side}${arm ? "Hand" : "Foot"}`);
    const constants: prepareChainConstants.IConstants | undefined =
      chains[limb];
    if (constants !== undefined && constants.parent !== null)
      requested.add(constants.parent);
    return { bones, requested, demand: resolution.prepareBones(requested) };
  };
  const limbs: readonly AutoMovieHumanLimb[] = [
    "leftArm",
    "rightArm",
    "leftLeg",
    "rightLeg",
  ];
  const out: Partial<
    Record<
      AutoMovieHumanLimb,
      readonly [humanLimbReads.IRead, humanLimbReads.IRead]
    >
  > = {};
  for (const limb of limbs) out[limb] = [read(limb, false), read(limb, true)];
  return out as humanLimbReads.IReads;
}

/** The reads' types. */
export namespace humanLimbReads {
  /** The interface contract (`IAutoMovieMotionHumanLimbReads.IRead`). */
  export type IRead = IAutoMovieMotionHumanLimbReads.IRead;

  /** The interface contract (`IAutoMovieMotionHumanLimbReads.IReads`). */
  export type IReads = IAutoMovieMotionHumanLimbReads.IReads;
}
