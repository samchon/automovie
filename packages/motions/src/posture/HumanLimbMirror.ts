import type { IAutoMoviePose } from "@automovie/interface";

import { HumanArmMirror } from "./HumanArmMirror";
import type { IHumanPosture } from "./IHumanPosture";

/**
 * A limb's fit seen in the median plane's mirror: the pose, the goal, the
 * limb and the side each taken to the other side, so a left limb is fitted
 * and remembered as the right limb of its mirror image (`HumanLimbFit`,
 * `HumanLimbFitMemory`) and a fit and its mirror are one to the bit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is mirrored and who reads it.
 * @evidence contracts/development/design.md#principled-representation The median-plane reflection of each part a limb's fit reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, read by the fit and its memory.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `HumanArmMirror` for every reflected part.
 */
export namespace HumanLimbMirror {
  /** A pose's mirror image in the median plane (`HumanArmMirror.mirrored`), its own inverse. */
  export function pose(pose: IAutoMoviePose): IAutoMoviePose {
    return HumanArmMirror.mirrored({ pose, others: [] }).pose;
  }

  /**
   * A limb goal's mirror image: its points and its contact with their
   * lateral component negated (world, or local to the bone it is attached
   * to, which a median-plane mirror maps alike), its rotation mirrored, the
   * bone it rides and the colliders it keeps clear of or lies on taken to
   * the other side. A reference's clinical angles are a side's own, so the
   * mirrored limb reads them as they are.
   *
   * @param goal The goal.
   * @returns Its mirror image.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is mirrored and why the reference is not.
   * @evidence contracts/development/implementation.md#principled-implementation The median-plane reflection of each of the goal's parts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record, one line per part.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every part a fit reads is mirrored.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per part.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanArmMirror`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function goal(goal: IHumanPosture.IGoal): IHumanPosture.IGoal {
    return {
      ...goal,
      point: HumanArmMirror.flip(goal.point),
      bend: HumanArmMirror.flip(goal.bend),
      ...(goal.rotation === undefined
        ? {}
        : { rotation: HumanArmMirror.turn(goal.rotation) }),
      ...(goal.contact === undefined
        ? {}
        : { contact: HumanArmMirror.flip(goal.contact) }),
      ...(goal.on === undefined
        ? {}
        : { on: HumanArmMirror.opposite(goal.on) }),
      ...(goal.clear === undefined
        ? {}
        : { clear: goal.clear.map(HumanArmMirror.reflected) }),
      ...(goal.rests === undefined
        ? {}
        : { rests: goal.rests.map(HumanArmMirror.reflected) }),
    };
  }

  /** The same limb on the other side. */
  export function limb(limb: IHumanPosture.Limb): IHumanPosture.Limb {
    return (
      limb.startsWith("left") ? `right${limb.slice(4)}` : `left${limb.slice(5)}`
    ) as IHumanPosture.Limb;
  }

  /** The other side. */
  export function side(side: "left" | "right"): "left" | "right" {
    return side === "left" ? "right" : "left";
  }
}
