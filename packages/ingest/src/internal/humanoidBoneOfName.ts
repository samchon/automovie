import type { AutoMovieHumanoidBone } from "@automovie/interface";

/*
 * Resolve an imported joint name to the humanoid slot its rig convention means.
 *
 * The name is lowercased, a leading `mixamorig` prefix (with or without its
 * colon) is removed, and whitespace, `_`, `.`, `:`, `|` and `-` are dropped, so
 * `mixamorig:LeftUpLeg`, `Left_UpLeg` and `leftUpLeg` all read as `leftupleg`.
 * The table covers the supported Blender-style names (`Spine`, `LeftUpLeg`),
 * Mixamo, VRM-style slot names (`leftUpperArm`), and Unreal mannequin spine
 * chains (`spine_01` to `spine_03`). Fingers, eyes and jaw have no alias, so a
 * hand rig maps only to its hand slot.
 * Parameter name: Joint node name exactly as the source declares it.
 * Returns: The slot, or `undefined` when no convention in the table names it.
 */
export function humanoidBoneOfName(
  name: string,
): AutoMovieHumanoidBone | undefined {
  return HUMANOID_ALIASES.get(
    name
      .toLowerCase()
      .replace(/^mixamorig:?/u, "")
      .replace(/[\s_.:|-]/gu, ""),
  );
}

const HUMANOID_ALIASES: ReadonlyMap<string, AutoMovieHumanoidBone> = new Map<
  string,
  AutoMovieHumanoidBone
>([
  ["hips", "hips"],
  ["pelvis", "hips"],
  ["spine", "spine"],
  ["spine01", "spine"],
  ["spine1", "chest"],
  ["chest", "chest"],
  ["spine02", "chest"],
  ["spine2", "upperChest"],
  ["spine03", "upperChest"],
  ["upperchest", "upperChest"],
  ["neck", "neck"],
  ["head", "head"],
  ["leftshoulder", "leftShoulder"],
  ["leftclavicle", "leftShoulder"],
  ["leftarm", "leftUpperArm"],
  ["leftupperarm", "leftUpperArm"],
  ["leftforearm", "leftLowerArm"],
  ["leftlowerarm", "leftLowerArm"],
  ["lefthand", "leftHand"],
  ["rightshoulder", "rightShoulder"],
  ["rightclavicle", "rightShoulder"],
  ["rightarm", "rightUpperArm"],
  ["rightupperarm", "rightUpperArm"],
  ["rightforearm", "rightLowerArm"],
  ["rightlowerarm", "rightLowerArm"],
  ["righthand", "rightHand"],
  ["leftupleg", "leftUpperLeg"],
  ["leftupperleg", "leftUpperLeg"],
  ["leftleg", "leftLowerLeg"],
  ["leftlowerleg", "leftLowerLeg"],
  ["leftfoot", "leftFoot"],
  ["lefttoebase", "leftToes"],
  ["lefttoes", "leftToes"],
  ["rightupleg", "rightUpperLeg"],
  ["rightupperleg", "rightUpperLeg"],
  ["rightleg", "rightLowerLeg"],
  ["rightlowerleg", "rightLowerLeg"],
  ["rightfoot", "rightFoot"],
  ["righttoebase", "rightToes"],
  ["righttoes", "rightToes"],
]);
