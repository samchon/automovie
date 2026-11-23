import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Map loaded glTF/VRM nodes onto the normalized bones a compiled proxy owns.
 *
 * Exact VRM names work for the whole humanoid set. Common Blender, Mixamo and
 * Unreal names for the major body chains are normalized through the same
 * aliases accepted by the ingest package. The first loaded node wins for each
 * slot so separate clothing skins cannot replace the body rig accidentally.
 */
export const mapImportedHumanoidBones: (
  object: THREE.Object3D,
  slots: readonly AutoMovieHumanoidBone[],
) => Map<AutoMovieHumanoidBone, THREE.Object3D> = (
  object: THREE.Object3D,
  slots: readonly AutoMovieHumanoidBone[],
): Map<AutoMovieHumanoidBone, THREE.Object3D> => {
  const requested: Set<AutoMovieHumanoidBone> = new Set(slots);
  const directSlots: Map<string, AutoMovieHumanoidBone> = new Map();
  for (const slot of slots) {
    const name: string = normalizeImportedBoneName(slot);
    // Preserve Array.find's first requested slot for a normalized name.
    if (!directSlots.has(name)) directSlots.set(name, slot);
  }
  const bones: Map<AutoMovieHumanoidBone, THREE.Object3D> = new Map();
  object.traverse((node: THREE.Object3D): void => {
    const normalized: string = normalizeImportedBoneName(node.name);
    const direct: AutoMovieHumanoidBone | undefined =
      directSlots.get(normalized);
    const slot: AutoMovieHumanoidBone | undefined =
      direct ?? IMPORTED_HUMANOID_ALIASES[normalized];
    if (slot !== undefined && requested.has(slot) && bones.has(slot) === false)
      bones.set(slot, node);
  });
  return bones;
};

const normalizeImportedBoneName: (name: string) => string = (
  name: string,
): string =>
  name
    .toLowerCase()
    .replace(/^mixamorig:?/u, "")
    .replace(/[\s_.:|-]/gu, "");

const IMPORTED_HUMANOID_ALIASES: Readonly<
  Record<string, AutoMovieHumanoidBone | undefined>
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
