import type { AutoMovieHumanBodyAnatomicalUnavailableReason } from "../generated/AutoMovieHumanBodyAnatomicalUnavailableReason";
import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";
import type { IAutoMovieHumanBodyLegMeasurements } from "./IAutoMovieHumanBodyLegMeasurements";

/**
 * Answer tibia, fibula, gastrocnemius heads, soleus and tibialis requests on both sides.
 *
 * This report resolver does not inspect source geometry or prove that these structures are absent. Its current registry has no qualified bony landmark or individual tissue-boundary generator, so bones receive `missing-bone-landmark` and muscles receive `missing-tissue-boundary`. The shared helper reports observed requests as `acquisition-not-registered`. Triceps surae is the owning group of three muscles, not an additional generated part; calf and ankle exterior dimensions remain separate.
 *
 * @evidence contracts/common.md#principled-implementation Leg reports keep two bones and five muscle bellies per side separate with acquisition precedence delegated consistently.
 * @evidence contracts/common.md#clear-and-simple-design A fixed owner list maps leg measurements directly; triceps surae supplies member requests rather than an extra part.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing tissue boundaries remain unavailable instead of inferring bellies from calf or ankle girth.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes generator qualification from inspected source anatomy and explains grouped calf ownership.
 * @evidence contracts/performance.md#efficient-algorithms Fourteen fixed reports traverse only their corresponding request subtrees to detect observed acquisitions.
 * @evidence contracts/performance.md#reuse-equivalent-work Side leg references are reused during enumeration; no mutable request result persists into another call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The fixed leg report array owns fourteen records and no muscle mesh, device handle or retained watcher.
 */
export function resolveHumanBodyLegParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const left: IAutoMovieHumanBodyLegMeasurements | undefined =
    input.targets?.leftLowerLimb?.leg;
  const right: IAutoMovieHumanBodyLegMeasurements | undefined =
    input.targets?.rightLowerLimb?.leg;
  const muscle: AutoMovieHumanBodyAnatomicalUnavailableReason =
    "missing-tissue-boundary";
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
