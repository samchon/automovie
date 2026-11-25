import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanStagePiste } from "./HumanStagePiste";

/** The foil's valid target: the trunk, without the head, the arms or the legs. */
const TRUNK: ReadonlySet<AutoMovieHumanoidRegion> = new Set([
  "sternum",
  "chestLeft",
  "chestRight",
  "solarPlexus",
  "abdomen",
  "liver",
  "spleen",
  "ribsLeft",
  "ribsRight",
  "upperBack",
  "lowerBack",
  "kidneyLeft",
  "kidneyRight",
  "groin",
]);

/** The regions below the sabre's valid target, the hips' bend and down. */
const BELOW_WAIST: ReadonlySet<AutoMovieHumanoidRegion> = new Set([
  "groin",
  "seat",
  "pocketFrontLeft",
  "pocketFrontRight",
  "hipLeft",
  "hipRight",
  "thighFrontLeft",
  "thighFrontRight",
  "thighOuterLeft",
  "thighOuterRight",
  "thighInnerLeft",
  "thighInnerRight",
  "kneeLeft",
  "kneeRight",
  "shinLeft",
  "shinRight",
  "calfLeft",
  "calfRight",
  "footTopLeft",
  "footTopRight",
  "soleLeft",
  "soleRight",
  "heelLeft",
  "heelRight",
]);

/** The struck regions of kendo armour, as the worn armour names its points. */
const STRUCK: ReadonlySet<string> = new Set([
  "men",
  "kote",
  "migiDo",
  "hidariDo",
  "tsuki",
]);

/**
 * Refuse a bout's target outside the weapon's valid target: the foil's trunk,
 * every region for the epee and every region above the waist for the sabre (FIE
 * Technical Rules), and for kendo a struck region of the opponent's worn armour
 * (FIK, The Regulations of Kendo Shiai and Shinpan, Articles 12 and 14).
 *
 * @param kind The weapon.
 * @param axis The take's input the target came from, named in the refusal.
 * @param target The target.
 * @throws {HumanRefusal} When the target lies outside the weapon's valid
 *   target.
 */
export function HumanPisteTarget(
  kind: HumanStagePiste.Kind,
  axis: string,
  target: IAutoMovieMotionTarget,
): void {
  const admitted: boolean =
    kind === "kendo"
      ? target.kind === "prop" && STRUCK.has(target.point)
      : target.kind === "person" &&
        (kind === "epee" ||
          (kind === "foil"
            ? TRUNK.has(target.region)
            : !BELOW_WAIST.has(target.region)));
  if (!admitted)
    throw new HumanRefusal({
      kind: "rule",
      axis,
      value: target,
      reason:
        kind === "kendo"
          ? "a kendo strike scores only on a struck region of the opponent's armour"
          : `the target lies outside the ${kind}'s valid target`,
      fix:
        kind === "kendo"
          ? "aim at the men, a kote, either side of the do or the tsuki of the worn armour"
          : kind === "foil"
            ? "aim at a region of the opponent's trunk"
            : "aim at a region of the opponent above the waist",
    });
}
