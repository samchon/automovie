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
 * VRMC_vrm takes precedence when both metadata families exist and emits recognized bone keys in code-unit order; VRM 0.x retains array order, migrates thumb names and rejects duplicate slots. Unknown names and invalid node indices throw, and absent metadata returns an empty list. VRMC_vrm is interpreted with 1.0 thumb names even for 1.0-beta declarations; this pass does not validate a complete VRM schema, unique target nodes or skin weights.
 *
 * @evidence contracts/common.md#principled-implementation VRMC_vrm uses named 1.0 slots and valid node indices; VRM 0.x maps renamed thumb slots and rejects duplicates.
 * @evidence contracts/common.md#clear-and-simple-design Version branching, thumb migration and the closed humanoid vocabulary stay with this metadata owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown or dangling mappings throw; VRMC_vrm beta thumb conventions remain an explicit unresolved interpretation limit.
 * @evidence contracts/common.md#meaningful-documentation The comment states metadata version branching, node references, ordering and unsupported beta interpretation.
 * @evidence contracts/performance.md#efficient-algorithms Work follows mapping entries and name text; 1.0 metadata enumerates B keys before O(B log B) prefix-scanning comparisons, while 0.x uses expected constant-time slot lookups after name admission.
 * @evidence contracts/performance.md#reuse-equivalent-work Each metadata mapping is resolved once during its inspector call; mutable documents prevent persistent equivalence caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Result slot records scale with declared mappings; temporary entries and uniqueness sets die on return or throw.
 */
export const vrmHumanoidBones: (
  document: Record<string, unknown>,
  nodes: unknown[],
) => IHumanoidSlot[] = (
  document: Record<string, unknown>,
  nodes: unknown[],
): IHumanoidSlot[] => {
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
};

/** Read a VRM 0.x bone name as its VRM 1.0 slot. VRM 1.0 renamed the thumb chain, so 0.x `ThumbProximal` is the 1.0 `ThumbMetacarpal` and 0.x `ThumbIntermediate` the 1.0 `ThumbProximal`; every other name is shared. */
const vrm0Bone: (value: unknown) => AutoMovieHumanoidBone | undefined = (
  value: unknown,
): AutoMovieHumanoidBone | undefined => {
  if (typeof value !== "string") return undefined;
  const migrated: string = Object.hasOwn(VRM0_THUMB_NAMES, value)
    ? VRM0_THUMB_NAMES[value]!
    : value;
  return Object.hasOwn(HUMANOID_BONES, migrated)
    ? (migrated as AutoMovieHumanoidBone)
    : undefined;
};

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
