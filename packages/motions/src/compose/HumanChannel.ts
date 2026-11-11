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
 */
export type HumanChannel =
  | "root"
  | "trunk"
  | "head"
  | "leftLeg"
  | "rightLeg"
  | "leftHand"
  | "rightHand"
  | "leftArm"
  | "rightArm";
export namespace HumanChannel {
  /**
   * The order channels are written in: the body is placed first and the
   * arms last, so a primitive reads every part its own part hangs from as
   * the action already placed it.
   */
  export const ORDER: readonly HumanChannel[] = [
    "root",
    "trunk",
    "head",
    "leftLeg",
    "rightLeg",
    "leftHand",
    "rightHand",
    "leftArm",
    "rightArm",
  ];

  /**
   * The channel that owns a bone's joint.
   *
   * @param bone The bone.
   * @returns Its channel.
   */
  export function of(bone: AutoMovieHumanoidBone): HumanChannel {
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
   */
  export function merge(
    base: IHumanPosture,
    written: IHumanPosture,
    channels: readonly HumanChannel[],
  ): IHumanPosture {
    const owns = (channel: HumanChannel): boolean => channels.includes(channel);
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
