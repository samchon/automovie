import type { prepareChainConstants, prepareSkeletonPoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { HumanArmObstacleBones } from "./HumanArmObstacleBones";
import type { IHumanPosture } from "./IHumanPosture";

/**
 * What each limb's fit reads of a pose, read once off the rig: per limb and
 * per whether the other arm is already placed (an arm's obstacles include
 * it then), the bones whose records a fit's reduced pose keeps
 * (`HumanLimbView.of`: the obstacles, the limb's own bones and every
 * ancestor of them) and the bone demand of its authored read (the
 * obstacles, the chain's effector and its root's parent:
 * `HumanLimbFit`'s source read), for a goal attached to no bone. Both are
 * functions of the rig and the limb alone; a fit whose goal is attached adds
 * that bone to its own copies.
 *
 * @param skeleton The rig.
 * @param resolution Its FK producer, which prepares the bound demands.
 * @param chains Its limbs' chain constants (`IHumanBody.chains`), for each chain's root's parent.
 * @returns The reads, by limb, then by `0` (the other arm not placed) and `1` (placed); a leg's two are alike.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, per what, which consumers read it and the attached-goal exception.
 * @evidence contracts/development/implementation.md#principled-implementation The same sets the view and the source read built per fit: the obstacle bones of the placed other arm (`HumanArmObstacleBones`), the limb's bones, closed under the rig's parent relation by the same climb; the demand is the rig producer's own `prepareBones` of the source read's set.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the four limbs and two placements; the view and the fit read the result.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Membership only: the view still filters each pose's own records in their order, and the demand reads each pose through the ordinary admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(B) a set for B bones, sixteen sets and eight demands once a body, where every fit built its two sets and sorted its demand.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A value of the rig, made with the body (`createHumanBody`) and held by it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Sixteen small sets and eight demands, released with the body.
 */
export function humanLimbReads(
  skeleton: IAutoMovieSkeleton,
  resolution: prepareSkeletonPoseResolution.IRig,
  chains: Readonly<Partial<Record<IHumanPosture.Limb, prepareChainConstants.IConstants>>>,
): humanLimbReads.IReads {
  const parents: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null> = new Map();
  for (const bone of skeleton.bones as readonly IAutoMovieBone[])
    if (!parents.has(bone.bone)) parents.set(bone.bone, bone.parent);
  const read = (limb: IHumanPosture.Limb, placed: boolean): humanLimbReads.IRead => {
    const side: "left" | "right" = limb.startsWith("left") ? "left" : "right";
    const arm: boolean = limb.endsWith("Arm");
    const others: ("left" | "right")[] = placed ? [side === "left" ? "right" : "left"] : [];
    const obstacles: ReadonlySet<AutoMovieHumanoidBone> | readonly AutoMovieHumanoidBone[] =
      arm ? HumanArmObstacleBones(others) : [];

    // The view's bones: the obstacles and the limb's own, closed under
    // parents as `HumanLimbView.of` climbs them.
    const bones: Set<AutoMovieHumanoidBone> = new Set(obstacles);
    for (const part of arm
      ? (["UpperArm", "LowerArm", "Hand"] as const)
      : (["UpperLeg", "LowerLeg", "Foot", "Toes"] as const))
      bones.add(`${side}${part}`);
    for (const bone of [...bones])
      for (
        let parent: AutoMovieHumanoidBone | null | undefined = parents.get(bone);
        parent !== null && parent !== undefined && !bones.has(parent);
        parent = parents.get(parent)
      )
        bones.add(parent);

    // The source read's bones: the obstacles, the effector, and the chain
    // root's parent where it has one.
    const requested: Set<AutoMovieHumanoidBone> = new Set(obstacles);
    requested.add(`${side}${arm ? "Hand" : "Foot"}`);
    const constants: prepareChainConstants.IConstants | undefined = chains[limb];
    if (constants !== undefined && constants.parent !== null) requested.add(constants.parent);
    return { bones, requested, demand: resolution.prepareBones(requested) };
  };
  const limbs: readonly IHumanPosture.Limb[] = ["leftArm", "rightArm", "leftLeg", "rightLeg"];
  const out: Partial<Record<IHumanPosture.Limb, readonly [humanLimbReads.IRead, humanLimbReads.IRead]>> = {};
  for (const limb of limbs) out[limb] = [read(limb, false), read(limb, true)];
  return out as humanLimbReads.IReads;
}

/**
 * The reads' types.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each member and the indexing.
 * @evidence contracts/development/design.md#principled-representation A membership set and a bound demand per limb and placement, the two things a fit reads of a pose's bones.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Held by `IHumanBody.reads`, read by `HumanLimbView.of` and `HumanLimbFit`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose or answer is held; an attached goal's bone is the consumer's to add.
 */
export namespace humanLimbReads {
  /**
   * One limb's reads under one placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three members.
   * @evidence contracts/development/design.md#principled-representation Bone names and the rig's own bound demand of the same names.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member has one reader.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Read-only sets.
   */
  export interface IRead {
    /** The bones whose records the limb's reduced pose keeps, closed under parents. */
    bones: ReadonlySet<AutoMovieHumanoidBone>;

    /** The bones the limb's source read demands. */
    requested: ReadonlySet<AutoMovieHumanoidBone>;

    /** The rig's bound demand of `requested`. */
    demand: prepareSkeletonPoseResolution.IBoneDemand;
  }

  /**
   * Every limb's reads: `[limb][0]` with the other arm not placed, `[limb][1]` with it placed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the indexing.
   * @evidence contracts/development/design.md#principled-representation A pair per limb, the placement being the one thing the sets vary by.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Made by `humanLimbReads` alone.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every limb present.
   */
  export type IReads = Readonly<Record<IHumanPosture.Limb, readonly [IRead, IRead]>>;
}
