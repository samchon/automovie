import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer each side's tibia, fibula, calf muscles and tibialis muscles.
 *
 * The connected source's knee and ankle points are rig joint centres; it
 * registers no tibial plateau, tuberosity or malleolus, so the tibia and
 * fibula are `missing-bone-landmark`. The one exterior skin holds no muscle
 * boundary, so both gastrocnemius heads, the soleus and both tibialis muscles
 * are `missing-tissue-boundary`; the triceps surae is their group, not a
 * fourth part. An observed value in a part's request refuses it as
 * `acquisition-not-registered`. Calf and ankle girths belong to the skin.
 *
 * @author Samchon
 */
export function resolveHumanBodyLegParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const left = input.targets?.leftLowerLimb?.leg;
  const right = input.targets?.rightLowerLimb?.leg;
  const muscle = "missing-tissue-boundary" as const;
  return [
    humanBodyUnavailablePart("leftTibia", left?.tibia, "missing-bone-landmark"),
    humanBodyUnavailablePart(
      "rightTibia",
      right?.tibia,
      "missing-bone-landmark",
    ),
    humanBodyUnavailablePart(
      "leftFibula",
      left?.fibula,
      "missing-bone-landmark",
    ),
    humanBodyUnavailablePart(
      "rightFibula",
      right?.fibula,
      "missing-bone-landmark",
    ),
    humanBodyUnavailablePart(
      "leftGastrocnemiusMedialHead",
      left?.tricepsSurae?.gastrocnemiusMedialHead,
      muscle,
    ),
    humanBodyUnavailablePart(
      "rightGastrocnemiusMedialHead",
      right?.tricepsSurae?.gastrocnemiusMedialHead,
      muscle,
    ),
    humanBodyUnavailablePart(
      "leftGastrocnemiusLateralHead",
      left?.tricepsSurae?.gastrocnemiusLateralHead,
      muscle,
    ),
    humanBodyUnavailablePart(
      "rightGastrocnemiusLateralHead",
      right?.tricepsSurae?.gastrocnemiusLateralHead,
      muscle,
    ),
    humanBodyUnavailablePart("leftSoleus", left?.tricepsSurae?.soleus, muscle),
    humanBodyUnavailablePart(
      "rightSoleus",
      right?.tricepsSurae?.soleus,
      muscle,
    ),
    humanBodyUnavailablePart(
      "leftTibialisAnterior",
      left?.tibialisAnterior,
      muscle,
    ),
    humanBodyUnavailablePart(
      "rightTibialisAnterior",
      right?.tibialisAnterior,
      muscle,
    ),
    humanBodyUnavailablePart(
      "leftTibialisPosterior",
      left?.tibialisPosterior,
      muscle,
    ),
    humanBodyUnavailablePart(
      "rightTibialisPosterior",
      right?.tibialisPosterior,
      muscle,
    ),
  ];
}
