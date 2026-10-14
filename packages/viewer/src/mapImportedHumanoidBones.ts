import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Map loaded glTF/VRM nodes onto the normalized bones a compiled proxy owns.
 *
 * Exact VRM names work for the whole humanoid set. Common Blender, Mixamo and Unreal names for the major body chains are normalized through the same aliases accepted by the ingest package. The first loaded node wins for each slot so separate clothing skins cannot replace the body rig accidentally.
 *
 * @evidence contracts/common.md#principled-implementation Matches normalized requested slots before the existing importer aliases and keeps the first traversed node for each requested bone.
 * @evidence contracts/common.md#clear-and-simple-design Name normalization and the fixed alias table remain local to imported-rig mapping, separate from proxy construction and animation retargeting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The normalized-slot Map preserves Array.find's first requested slot and original node traversal precedence; no expected rig or consumer receives a special mapping.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies accepted VRM/Blender/Mixamo/Unreal naming, requested-slot restriction and first-node precedence without claiming observed rig appearance.
 * @evidence contracts/performance.md#efficient-algorithms S slot names normalize once and N node names normalize once, yielding expected O(S+N) lookups plus name bytes and O(S) maps instead of repeating normalization for each node.
 * @evidence contracts/performance.md#reuse-equivalent-work Normalized requested-slot equivalence is shared within one traversal; the current loaded object tree is reread each call and no map survives across a changed rig.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only matched node references escape in the result, keeping those borrowed nodes reachable; temporary name/slot maps leave the call and no skeleton or GPU resource is acquired.
 */
export const mapImportedHumanoidBones: (object: THREE.Object3D, slots: readonly AutoMovieHumanoidBone[]) => Map<AutoMovieHumanoidBone, THREE.Object3D> = (
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
    const direct: AutoMovieHumanoidBone | undefined = directSlots.get(normalized);
    const slot: AutoMovieHumanoidBone | undefined = direct ?? IMPORTED_HUMANOID_ALIASES[normalized];
    if (slot !== undefined && requested.has(slot) && bones.has(slot) === false)
      bones.set(slot, node);
  });
  return bones;
};

const normalizeImportedBoneName: (name: string) => string = (name: string): string =>
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
