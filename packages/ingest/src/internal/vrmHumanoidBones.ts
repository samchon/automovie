import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanoidSlot } from "./IHumanoidSlot";
import { compareCodeUnits } from "./compareCodeUnits";
import { object } from "./object";
import { optionalObject } from "./optionalObject";
import { requiredArray } from "./requiredArray";
import { validNodeIndex } from "./validNodeIndex";

/**
 * Read declared VRM humanoid mappings using version-specific thumb migration.
 *
 * VRMC_vrm takes precedence when both metadata families exist and emits
 * recognized bone keys in code-unit order; VRM 0.x retains array order,
 * migrates thumb names and rejects duplicate slots. Unknown names and invalid
 * node indices throw, and absent metadata returns an empty list. VRMC_vrm is
 * interpreted with 1.0 thumb names even for 1.0-beta declarations; this pass
 * does not validate a complete VRM schema, unique target nodes or skin
 * weights.
 */
export function vrmHumanoidBones(
  document: Record<string, unknown>,
  nodes: unknown[],
): IHumanoidSlot[] {
  const extensions: Record<string, unknown> = optionalObject(
    document.extensions,
    "extensions",
  );
  if (extensions.VRMC_vrm !== undefined) {
    const vrm: Record<string, unknown> = object(
      extensions.VRMC_vrm,
      "extensions.VRMC_vrm",
    );
    const humanoid: Record<string, unknown> = object(
      vrm.humanoid,
      "extensions.VRMC_vrm.humanoid",
    );
    const bones: Record<string, unknown> = object(
      humanoid.humanBones,
      "extensions.VRMC_vrm.humanoid.humanBones",
    );
    return Object.entries(bones)
      .sort(([left]: [string, unknown], [right]: [string, unknown]): number =>
        compareCodeUnits(left, right),
      )
      .map(([bone, value]: [string, unknown]): IHumanoidSlot => {
        if (Object.hasOwn(HUMANOID_BONES, bone) === false)
          throw new Error(`VRMC_vrm declares unknown humanoid bone "${bone}".`);
        const node: unknown = object(
          value,
          `extensions.VRMC_vrm.humanoid.humanBones.${bone}`,
        ).node;
        if (validNodeIndex(node, nodes.length) === false)
          throw new Error(
            `VRMC_vrm humanoid bone "${bone}" does not resolve to a node.`,
          );
        return { bone: bone as AutoMovieHumanoidBone, node: node as number };
      });
  }
  if (extensions.VRM !== undefined) {
    const vrm: Record<string, unknown> = object(
      extensions.VRM,
      "extensions.VRM",
    );
    const humanoid: Record<string, unknown> = object(
      vrm.humanoid,
      "extensions.VRM.humanoid",
    );
    const used: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>();
    return requiredArray(
      humanoid.humanBones,
      "extensions.VRM.humanoid.humanBones",
    ).map((value: unknown, index: number): IHumanoidSlot => {
      const entry: Record<string, unknown> = object(
        value,
        `extensions.VRM.humanoid.humanBones[${index}]`,
      );
      const bone: AutoMovieHumanoidBone | undefined = vrm0Bone(entry.bone);
      if (
        bone === undefined ||
        validNodeIndex(entry.node, nodes.length) === false ||
        used.has(bone)
      )
        throw new Error(
          `VRM humanoid entry ${index} has an unknown, duplicate or dangling bone mapping.`,
        );
      used.add(bone);
      return { bone, node: entry.node as number };
    });
  }
  return [];
}

/**
 * Read a VRM 0.x bone name as its VRM 1.0 slot. VRM 1.0 renamed the thumb
 * chain, so 0.x `ThumbProximal` is the 1.0 `ThumbMetacarpal` and 0.x
 * `ThumbIntermediate` the 1.0 `ThumbProximal`; every other name is shared.
 */
function vrm0Bone(value: unknown): AutoMovieHumanoidBone | undefined {
  if (typeof value !== "string") return undefined;
  const migrated: string = Object.hasOwn(VRM0_THUMB_NAMES, value)
    ? VRM0_THUMB_NAMES[value]!
    : value;
  return Object.hasOwn(HUMANOID_BONES, migrated)
    ? (migrated as AutoMovieHumanoidBone)
    : undefined;
}

const VRM0_THUMB_NAMES: Readonly<Record<string, AutoMovieHumanoidBone>> = {
  leftThumbProximal: "leftThumbMetacarpal",
  leftThumbIntermediate: "leftThumbProximal",
  rightThumbProximal: "rightThumbMetacarpal",
  rightThumbIntermediate: "rightThumbProximal",
};

/** Every humanoid slot; the `Record` type requires exactly the union's keys. */
const HUMANOID_BONES: Readonly<Record<AutoMovieHumanoidBone, true>> = {
  hips: true,
  spine: true,
  chest: true,
  upperChest: true,
  neck: true,
  head: true,
  leftEye: true,
  rightEye: true,
  jaw: true,
  leftShoulder: true,
  leftUpperArm: true,
  leftLowerArm: true,
  leftHand: true,
  rightShoulder: true,
  rightUpperArm: true,
  rightLowerArm: true,
  rightHand: true,
  leftUpperLeg: true,
  leftLowerLeg: true,
  leftFoot: true,
  leftToes: true,
  rightUpperLeg: true,
  rightLowerLeg: true,
  rightFoot: true,
  rightToes: true,
  leftThumbMetacarpal: true,
  leftThumbProximal: true,
  leftThumbDistal: true,
  leftIndexProximal: true,
  leftIndexIntermediate: true,
  leftIndexDistal: true,
  leftMiddleProximal: true,
  leftMiddleIntermediate: true,
  leftMiddleDistal: true,
  leftRingProximal: true,
  leftRingIntermediate: true,
  leftRingDistal: true,
  leftLittleProximal: true,
  leftLittleIntermediate: true,
  leftLittleDistal: true,
  rightThumbMetacarpal: true,
  rightThumbProximal: true,
  rightThumbDistal: true,
  rightIndexProximal: true,
  rightIndexIntermediate: true,
  rightIndexDistal: true,
  rightMiddleProximal: true,
  rightMiddleIntermediate: true,
  rightMiddleDistal: true,
  rightRingProximal: true,
  rightRingIntermediate: true,
  rightRingDistal: true,
  rightLittleProximal: true,
  rightLittleIntermediate: true,
  rightLittleDistal: true,
};
