import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Map loaded glTF/VRM nodes onto the normalized bones a compiled proxy owns.
 *
 * Exact VRM names work for the whole humanoid set. Common Blender, Mixamo and
 * Unreal names for the major body chains are normalized through the same
 * aliases accepted by the ingest package. The first loaded node wins for each
 * slot so separate clothing skins cannot replace the body rig accidentally.
 *
 * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-mapping-selection Selects deterministic humanoid slots from direct names and known aliases.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Implements the concrete source-node to target-slot retarget mapping candidate.
 */
export const mapImportedHumanoidBones = (
  object: THREE.Object3D,
  slots: readonly AutoMovieHumanoidBone[],
): Map<AutoMovieHumanoidBone, THREE.Object3D> => {
  const requested = new Set(slots);
  const bones = new Map<AutoMovieHumanoidBone, THREE.Object3D>();
  object.traverse((node) => {
    const normalized = normalizeImportedBoneName(node.name);
    const direct = slots.find(
      (slot) => normalizeImportedBoneName(slot) === normalized,
    );
    const slot = direct ?? IMPORTED_HUMANOID_ALIASES[normalized];
    if (slot !== undefined && requested.has(slot) && bones.has(slot) === false)
      bones.set(slot, node);
  });
  return bones;
};

const normalizeImportedBoneName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/^mixamorig:?/u, "")
    .replace(/[\s_.:|-]/gu, "");

const IMPORTED_HUMANOID_ALIASES: Readonly<
  Record<string, AutoMovieHumanoidBone>
> = {
  pelvis: "hips",
  spine01: "spine",
  spine1: "chest",
  spine02: "chest",
  spine2: "upperChest",
  spine03: "upperChest",
  leftclavicle: "leftShoulder",
  leftarm: "leftUpperArm",
  leftforearm: "leftLowerArm",
  leftupleg: "leftUpperLeg",
  leftleg: "leftLowerLeg",
  lefttoebase: "leftToes",
  rightclavicle: "rightShoulder",
  rightarm: "rightUpperArm",
  rightforearm: "rightLowerArm",
  rightupleg: "rightUpperLeg",
  rightleg: "rightLowerLeg",
  righttoebase: "rightToes",
};
