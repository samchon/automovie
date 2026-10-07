import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer each side's eight carpal bones.
 *
 * The connected source carries one hand joint for its rig; it registers no
 * carpal bone, no radiocarpal or midcarpal articular landmark, so the
 * scaphoid, lunate, triquetrum, pisiform, trapezium, trapezoid, capitate and
 * hamate are `missing-bone-landmark`. The one hand transform flexes and
 * deviates the skin and verifies no carpal kinematics. An observed value in
 * a part's request refuses it as `acquisition-not-registered`. Hand length
 * and breadth belong to the skin.
 *
 * @evidence contracts/common.md#principled-implementation Each part's reason names the source dependency the connected exterior lacks.
 * @evidence contracts/common.md#clear-and-simple-design One answer per owned part from that part's own request subtree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A wrist angle or hand breadth never produces a carpal bone.
 * @evidence contracts/common.md#meaningful-documentation States the reason and why the one hand joint is no carpal model.
 * @evidence contracts/modeling.md#part-identity-and-grouping Owns each side's scaphoid, lunate, triquetrum, pisiform, trapezium, trapezoid, capitate and hamate.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It reads no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The exterior builder owns the shared skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The exterior consumer displays the answers.
 * @evidence contracts/anatomy.md#anatomical-source The reasons state what the source lacks; no anatomical value is asserted.
 * @evidence contracts/anatomy.md#permitted-range Unregistered observations refuse with their cause and the request is left unchanged.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export function resolveHumanBodyCarpusParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const bone = "missing-bone-landmark" as const;
  return (["left", "right"] as const).flatMap((side) => {
    const carpus = input.targets?.[`${side}UpperLimb`]?.hand?.carpus;
    return [
      humanBodyUnavailablePart(
        `${side}Scaphoid` as const,
        carpus?.scaphoid,
        bone,
      ),
      humanBodyUnavailablePart(`${side}Lunate` as const, carpus?.lunate, bone),
      humanBodyUnavailablePart(
        `${side}Triquetrum` as const,
        carpus?.triquetrum,
        bone,
      ),
      humanBodyUnavailablePart(
        `${side}Pisiform` as const,
        carpus?.pisiform,
        bone,
      ),
      humanBodyUnavailablePart(
        `${side}Trapezium` as const,
        carpus?.trapezium,
        bone,
      ),
      humanBodyUnavailablePart(
        `${side}Trapezoid` as const,
        carpus?.trapezoid,
        bone,
      ),
      humanBodyUnavailablePart(
        `${side}Capitate` as const,
        carpus?.capitate,
        bone,
      ),
      humanBodyUnavailablePart(`${side}Hamate` as const, carpus?.hamate, bone),
    ];
  });
}
