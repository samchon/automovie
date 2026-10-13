import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Resolve an imported joint name to the humanoid slot its rig convention means.
 *
 * The name is lowercased, a leading `mixamorig` prefix (with or without its colon) is removed, and whitespace, `_`, `.`, `:`, `|` and `-` are dropped, so `mixamorig:LeftUpLeg`, `Left_UpLeg` and `leftUpLeg` all read as `leftupleg`. The table covers the supported Blender-style names (`Spine`, `LeftUpLeg`), Mixamo, VRM-style slot names (`leftUpperArm`), and Unreal mannequin spine chains (`spine_01` to `spine_03`). Fingers, eyes and jaw have no alias, so a hand rig maps only to its hand slot.
 *
 * @param name Joint node name exactly as the source declares it.
 * @returns The slot, or `undefined` when no convention in the table names it.
 *
 * @evidence contracts/common.md#principled-implementation Lowercasing, removing a leading `mixamorig` prefix and dropping separator characters reduces each convention's spelling to one key, and an exact `Map` lookup resolves it, so inherited object keys can never match.
 * @evidence contracts/common.md#clear-and-simple-design The table and the normalization live in one module that the skeleton importer and the byte inspector both call, replacing two copies that had to be kept in step.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The closed alias vocabulary is a naming convention supported by this mapper rather than an anatomical inference, and both callers keep their own first-claim rule instead of the helper guessing between duplicates.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the normalization steps with an example, the covered conventions, the unmapped finger, eye and jaw slots, and what `undefined` means.
 * @evidence contracts/performance.md#efficient-algorithms Cost is linear in the name length for two regular-expression passes and one lowercase copy, then one hash lookup.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each caller resolves each eligible joint once per import, and this helper introduces no cross-call cache for mutable source revisions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The module-level table is a fixed forty-entry constant; a call retains nothing.
 * @author Samchon
 */
export const humanoidBoneOfName: (name: string) => AutoMovieHumanoidBone | undefined = (
  name: string,
): AutoMovieHumanoidBone | undefined =>
  HUMANOID_ALIASES.get(
    name
      .toLowerCase()
      .replace(/^mixamorig:?/u, "")
      .replace(/[\s_.:|-]/gu, ""),
  );

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
