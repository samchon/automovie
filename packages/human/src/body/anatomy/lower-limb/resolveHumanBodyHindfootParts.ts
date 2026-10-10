import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer each side's talus and calcaneus.
 *
 * The connected source moves the whole foot on one ankle joint centre and
 * registers no talar or calcaneal landmark, so both bones are
 * `missing-bone-landmark`; the talocrural and subtalar joints are not
 * separated in the source rig. The mortise surfaces of the tibia and fibula
 * belong to the leg region and the midfoot to the forefoot region. An
 * observed bone volume refuses its bone as `acquisition-not-registered`.
 *
 * @author Samchon
 */
export function resolveHumanBodyHindfootParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const left = input.targets?.leftLowerLimb?.foot;
  const right = input.targets?.rightLowerLimb?.foot;
  return [
    humanBodyUnavailablePart("leftTalus", left?.talus, "missing-bone-landmark"),
    humanBodyUnavailablePart(
      "rightTalus",
      right?.talus,
      "missing-bone-landmark",
    ),
    humanBodyUnavailablePart(
      "leftCalcaneus",
      left?.calcaneus,
      "missing-bone-landmark",
    ),
    humanBodyUnavailablePart(
      "rightCalcaneus",
      right?.calcaneus,
      "missing-bone-landmark",
    ),
  ];
}
