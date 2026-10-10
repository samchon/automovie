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
