import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { createArmour } from "./createArmour";

/**
 * The bone a piece of armour rides, which `createArmour.bone` gives: a helmet the head, a cuirass and mail the chest, a gauntlet a hand, a vambrace a lower arm and a greave a lower leg, on the side given.
 *
 * @param kind The kind.
 * @param side A limb piece's side; the left when absent. A helmet, a cuirass and mail ignore it.
 * @returns The bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the input, the side's default and which kinds read it, and the result.
 * @evidence contracts/development/implementation.md#principled-implementation The bone whose segment the piece covers: the head, the chest, a hand, a lower arm, a lower leg.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per covered segment.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function armourBone(
  kind: createArmour.Kind,
  side: "left" | "right" = "left",
): AutoMovieHumanoidBone {
  if (
    kind === "openHelmet" ||
    kind === "closedHelmet" ||
    kind === "brimmedHelmet"
  )
    return "head";
  if (kind === "cuirass" || kind === "mail") return "chest";
  if (kind === "gauntlet") return side === "left" ? "leftHand" : "rightHand";
  if (kind === "vambrace")
    return side === "left" ? "leftLowerArm" : "rightLowerArm";
  return side === "left" ? "leftLowerLeg" : "rightLowerLeg";
}
