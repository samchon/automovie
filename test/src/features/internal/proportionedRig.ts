import type { AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieSkeleton, IAutoMovieTransform } from "@automovie/interface";
import { ARM_BONES } from "./ARM_BONES";
import { LEG_BONES } from "./LEG_BONES";
import type { IProportions } from "./IProportions";
import { retargetRestAt as restAt } from "./retargetRestAt";

/** Build the existing synthetic rig with independently scaled limb-group offsets; at unit proportions its authored hips height is 1, ankle is (+/-0.1, 0.1, 0.1) and head height is 1.75 metres. These are test conventions, not anatomical measurements. */
export const proportionedRig: (id: string, proportions?: IProportions) => IAutoMovieSkeleton = (
  id: string,
  proportions: IProportions = {},
): IAutoMovieSkeleton => {
  const leg: number = proportions.leg ?? 1;
  const torso: number = proportions.torso ?? 1;
  const arm: number = proportions.arm ?? 1;
  const at: (slot: AutoMovieHumanoidBone, x: number, y: number, z: number) => IAutoMovieTransform = (
    slot: AutoMovieHumanoidBone,
    x: number,
    y: number,
    z: number,
  ): IAutoMovieTransform => {
    const factor: number = LEG_BONES.includes(slot)
      ? leg
      : ARM_BONES.includes(slot)
        ? arm
        : torso;
    return restAt(x * factor, y * factor, z * factor);
  };
  return {
    id,
    bones: [
      bone("hips", null, at("hips", 0, 1.0, 0)),
      bone("spine", "hips", at("spine", 0, 0.2, 0)),
      bone("chest", "spine", at("chest", 0, 0.25, 0)),
      bone("neck", "chest", at("neck", 0, 0.15, 0)),
      bone("head", "neck", at("head", 0, 0.15, 0)),
      bone("leftUpperArm", "chest", at("leftUpperArm", 0.18, 0.15, 0)),
      bone("leftLowerArm", "leftUpperArm", at("leftLowerArm", 0.28, 0, 0)),
      bone("leftHand", "leftLowerArm", at("leftHand", 0.25, 0, 0)),
      bone("rightUpperArm", "chest", at("rightUpperArm", -0.18, 0.15, 0)),
      bone("rightLowerArm", "rightUpperArm", at("rightLowerArm", -0.28, 0, 0)),
      bone("rightHand", "rightLowerArm", at("rightHand", -0.25, 0, 0)),
      bone("leftUpperLeg", "hips", at("leftUpperLeg", 0.1, -0.05, 0)),
      bone("leftLowerLeg", "leftUpperLeg", at("leftLowerLeg", 0, -0.45, 0)),
      bone("leftFoot", "leftLowerLeg", at("leftFoot", 0, -0.4, 0.1)),
      bone("rightUpperLeg", "hips", at("rightUpperLeg", -0.1, -0.05, 0)),
      bone("rightLowerLeg", "rightUpperLeg", at("rightLowerLeg", 0, -0.45, 0)),
      bone("rightFoot", "rightLowerLeg", at("rightFoot", 0, -0.4, 0.1)),
    ],
  };
};

/** Retain the original bone identity, parent and rest transform with no ROM override. */
const bone: (name: AutoMovieHumanoidBone, parent: AutoMovieHumanoidBone | null, rest: IAutoMovieTransform) => IAutoMovieBone = (
  name: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
  rest: IAutoMovieTransform,
): IAutoMovieBone => ({ bone: name, parent, rest, constraint: null });
