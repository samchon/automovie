import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * A part of the body one primitive writes at a time.
 *
 * The channels partition {@link IHumanPosture}: `root` owns `root` and `yaw`;
 * `trunk` owns `pitch`, `roll` and the joints of the pelvis, the spine and the
 * shoulder girdles; `head` owns the neck, the head, the jaw and the eyes;
 * each arm owns its limb goal and the joints of its upper arm, forearm and
 * hand; each hand owns its finger joints; each leg owns its limb goal and the
 * joints of its thigh, shank, foot and toes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a channel is and which fields of a posture each one owns.
 * @evidence contracts/development/design.md#principled-representation A partition of the posture by the kinematic tree: the root, the trunk it carries, the head and the limbs that hang from the trunk, and each hand at the end of its arm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Nine channels, the coarsest split under which two parts of one action never need the same channel at once; the only owner of which field belongs to which part.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union read from the `ORDER` list, so a primitive cannot claim a part the merge does not know and a page lists the same channels.
 */
export type AutoMovieMotionHumanChannel =
  (typeof AutoMovieMotionHumanChannel.ORDER)[number];
export namespace AutoMovieMotionHumanChannel {
  /**
   * The order channels are written in: the body is placed first and the
   * arms last, so a primitive reads every part its own part hangs from as
   * the action already placed it. The hands' fingers come before the arms
   * although they hang from them: an arm's goal lays a surface of the hand
   * (the palm, a fingertip, the fist) on its target, and the arm's fit reads
   * that surface with the fingers as their own primitive shapes them, while
   * a finger's angles read nothing of the arm. The channels as data: the
   * union is read from this list.
   */
  export const ORDER = [
    "root",
    "trunk",
    "head",
    "leftLeg",
    "rightLeg",
    "leftHand",
    "rightHand",
    "leftArm",
    "rightArm",
  ] as const;

  /**
   * The channel that owns a bone's joint.
   *
   * @param bone The bone.
   * @returns Its channel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result; the type's document gives the partition.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the side and the part from the bone's name, the rig vocabulary's own structure, and maps the part to its channel by the partition the type states.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One side test, then one branch per part group.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Eyes and shoulder girdles carry a side in their names but belong to the head and the trunk, and are routed there before the limb rules.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(bone: AutoMovieHumanoidBone): AutoMovieMotionHumanChannel {
    const side: "left" | "right" | undefined = bone.startsWith("left")
      ? "left"
      : bone.startsWith("right")
        ? "right"
        : undefined;
    if (side === undefined)
      return bone === "neck" || bone === "head" || bone === "jaw"
        ? "head"
        : "trunk";
    const part: string = bone.slice(side.length);
    if (part === "Eye") return "head";
    if (part === "Shoulder") return "trunk";
    if (/^(Thumb|Index|Middle|Ring|Little)/.test(part)) return `${side}Hand`;
    if (part === "UpperArm" || part === "LowerArm" || part === "Hand")
      return `${side}Arm`;
    return `${side}Leg`;
  }

  /**
   * A posture with some channels taken from another: every field the
   * channels own is copied from `written`, everything else stays as `base`
   * has it. A joint or a limb goal `written` no longer sets is cleared.
   *
   * @param base The posture the other channels keep.
   * @param written The posture the channels were written on.
   * @param channels The channels to take.
   * @returns The merged posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is copied, what stays and what happens to a field the written posture no longer sets.
   * @evidence contracts/development/implementation.md#principled-implementation Each field goes to the posture of its owner: the channels' fields from the written posture, the rest from the base, so a primitive cannot change a part it did not claim.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two passes over the joints, one over the four limbs, and four scalar choices.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An owned joint or limb goal absent from the written posture is cleared and not inherited from the base, so a primitive can release a goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the joints the two postures hold.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `of` for every joint.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function merge(
    base: IHumanPosture,
    written: IHumanPosture,
    channels: readonly AutoMovieMotionHumanChannel[],
  ): IHumanPosture {
    const owns = (channel: AutoMovieMotionHumanChannel): boolean =>
      channels.includes(channel);
    const joints: IHumanPosture["joints"] = {};
    for (const [bone, angles] of Object.entries(base.joints) as [
      AutoMovieHumanoidBone,
      readonly [number, number, number],
    ][])
      if (!owns(of(bone))) joints[bone] = angles;
    for (const [bone, angles] of Object.entries(written.joints) as [
      AutoMovieHumanoidBone,
      readonly [number, number, number],
    ][])
      if (owns(of(bone))) joints[bone] = angles;
    const limbs: IHumanPosture["limbs"] = {};
    for (const limb of [
      "leftArm",
      "rightArm",
      "leftLeg",
      "rightLeg",
    ] as const) {
      const goal: IHumanPosture.IGoal | undefined = (
        owns(limb) ? written : base
      ).limbs[limb];
      if (goal !== undefined) limbs[limb] = goal;
    }
    return {
      root: owns("root") ? written.root : base.root,
      yaw: owns("root") ? written.yaw : base.yaw,
      pitch: owns("trunk") ? written.pitch : base.pitch,
      roll: owns("trunk") ? written.roll : base.roll,
      joints,
      limbs,
    };
  }
}
