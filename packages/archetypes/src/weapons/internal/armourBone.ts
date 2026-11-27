import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { AutoMovieArchetypeArmour } from "../AutoMovieArchetypeArmour";

/**
 * The bone a piece of armour rides, which `createArmour.bone` gives: a helmet
 * the head, a cuirass and mail the chest, a gauntlet a hand, a vambrace a lower
 * arm and a greave a lower leg, on the side given.
 *
 * @param kind The kind.
 * @param side A limb piece's side; the left when absent. A helmet, a cuirass
 *   and mail ignore it.
 * @returns The bone.
 */
export function armourBone(
  kind: AutoMovieArchetypeArmour.Kind,
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
