import type { AutoMovieHumanBodyAnatomicalUnavailableReason } from "../generated/AutoMovieHumanBodyAnatomicalUnavailableReason";
import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";
import type { IAutoMovieHumanBodyThighMeasurements } from "./IAutoMovieHumanBodyThighMeasurements";

/**
 * Answer each side's femur, quadriceps, hamstrings, adductor magnus and iliotibial tract.
 *
 * This function reports current region generator limitations without inspecting the basis or claiming its source anatomy is absent. No qualified femoral landmark or thigh tissue-boundary generator is registered here, so bones and tissues receive their respective missing-landmark/boundary reasons. Observed requests receive `acquisition-not-registered` through the shared helper. Femoral-head candidate inspection is a separate consumer and does not establish a complete femur; exterior thigh dimensions remain separate from these internal quantities.
 *
 * @evidence contracts/common.md#principled-implementation Thigh reports preserve femur and individual tissue identities while refusing unsupported reconstruction through shared reason precedence.
 * @evidence contracts/common.md#clear-and-simple-design Quadriceps/hamstring nesting resolves individual bellies, with adductor and iliotibial tract owned separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A head-radius candidate or exterior thigh dimension does not stand in for complete femur or tissue surfaces.
 * @evidence contracts/common.md#meaningful-documentation Comments separate current generator limitations, uninspected source basis and independent articular inspection.
 * @evidence contracts/performance.md#efficient-algorithms The fixed bilateral thigh list costs its report count plus observation scans of the selected component requests.
 * @evidence contracts/performance.md#reuse-equivalent-work Per-side thigh references serve the whole enumeration; current mutable requests prevent persistent report reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Thigh reports allocate only their fixed result population and acquire no generated tissue resources.
 */
export function resolveHumanBodyThighParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const left: IAutoMovieHumanBodyThighMeasurements | undefined =
    input.targets?.leftLowerLimb?.thigh;
  const right: IAutoMovieHumanBodyThighMeasurements | undefined =
    input.targets?.rightLowerLimb?.thigh;
  const muscle: AutoMovieHumanBodyAnatomicalUnavailableReason =
    "missing-tissue-boundary";
  return [
    humanBodyUnavailablePart("leftFemur", left?.femur, "missing-bone-landmark"),
    humanBodyUnavailablePart(
      "rightFemur",
      right?.femur,
      "missing-bone-landmark",
    ),
    humanBodyUnavailablePart(
      "leftRectusFemoris",
      left?.quadriceps?.rectusFemoris,
      muscle,
    ),
    humanBodyUnavailablePart(
      "rightRectusFemoris",
      right?.quadriceps?.rectusFemoris,
      muscle,
    ),
    humanBodyUnavailablePart(
      "leftVastusLateralis",
      left?.quadriceps?.vastusLateralis,
      muscle,
    ),
    humanBodyUnavailablePart(
      "rightVastusLateralis",
      right?.quadriceps?.vastusLateralis,
      muscle,
    ),
    humanBodyUnavailablePart(
      "leftVastusMedialis",
      left?.quadriceps?.vastusMedialis,
      muscle,
    ),
    humanBodyUnavailablePart(
      "rightVastusMedialis",
      right?.quadriceps?.vastusMedialis,
      muscle,
    ),
    humanBodyUnavailablePart(
      "leftVastusIntermedius",
      left?.quadriceps?.vastusIntermedius,
      muscle,
    ),
    humanBodyUnavailablePart(
      "rightVastusIntermedius",
      right?.quadriceps?.vastusIntermedius,
      muscle,
    ),
    humanBodyUnavailablePart(
      "leftBicepsFemorisLongHead",
      left?.hamstrings?.bicepsFemorisLongHead,
      muscle,
    ),
    humanBodyUnavailablePart(
      "rightBicepsFemorisLongHead",
      right?.hamstrings?.bicepsFemorisLongHead,
      muscle,
    ),
    humanBodyUnavailablePart(
      "leftBicepsFemorisShortHead",
      left?.hamstrings?.bicepsFemorisShortHead,
      muscle,
    ),
    humanBodyUnavailablePart(
      "rightBicepsFemorisShortHead",
      right?.hamstrings?.bicepsFemorisShortHead,
      muscle,
    ),
    humanBodyUnavailablePart(
      "leftSemitendinosus",
      left?.hamstrings?.semitendinosus,
      muscle,
    ),
    humanBodyUnavailablePart(
      "rightSemitendinosus",
      right?.hamstrings?.semitendinosus,
      muscle,
    ),
    humanBodyUnavailablePart(
      "leftSemimembranosus",
      left?.hamstrings?.semimembranosus,
      muscle,
    ),
    humanBodyUnavailablePart(
      "rightSemimembranosus",
      right?.hamstrings?.semimembranosus,
      muscle,
    ),
    humanBodyUnavailablePart(
      "leftAdductorMagnus",
      left?.adductorMagnus,
      muscle,
    ),
    humanBodyUnavailablePart(
      "rightAdductorMagnus",
      right?.adductorMagnus,
      muscle,
    ),
    humanBodyUnavailablePart(
      "leftIliotibialTract",
      left?.iliotibialTract,
      muscle,
    ),
    humanBodyUnavailablePart(
      "rightIliotibialTract",
      right?.iliotibialTract,
      muscle,
    ),
  ];
}
