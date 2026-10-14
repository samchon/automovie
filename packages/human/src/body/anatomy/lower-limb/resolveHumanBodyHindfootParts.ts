import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";
import type { IAutoMovieHumanBodyFootMeasurements } from "./IAutoMovieHumanBodyFootMeasurements";

/**
 * Answer each side's talus and calcaneus with the current hindfoot generator's unavailable reports.
 *
 * This resolver reads requests without inspecting basis landmarks or rig joints. No qualified talar/calcaneal generator is registered here, so both bones receive `missing-bone-landmark` unless the shared helper reports an unregistered acquisition. Existing source geometry does not by itself establish individual subtalar or ankle surfaces. Tibial/fibular mortise ownership remains in the leg region.
 *
 * @evidence contracts/common.md#principled-implementation Hindfoot reports preserve talus/calcaneus ownership and shared observed-request reason precedence without claiming source absence.
 * @evidence contracts/common.md#clear-and-simple-design Four explicit side/bone mappings keep request ownership visible and avoid a speculative hindfoot abstraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable reports do not synthesize ankle surfaces from a supplied volume or coarse source skin.
 * @evidence contracts/common.md#meaningful-documentation Prose states no basis inspection, qualified generator limits and adjacent mortise ownership.
 * @evidence contracts/performance.md#efficient-algorithms Four reports require fixed mapping work plus traversal of the four supplied request subtrees.
 * @evidence contracts/performance.md#reuse-equivalent-work Hindfoot request references are reused locally; no cross-call geometry calculation is performed or shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One call allocates four report records and retains no rig, segmented mesh or acquisition handle.
 */
export function resolveHumanBodyHindfootParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const left: IAutoMovieHumanBodyFootMeasurements | undefined =
    input.targets?.leftLowerLimb?.foot;
  const right: IAutoMovieHumanBodyFootMeasurements | undefined =
    input.targets?.rightLowerLimb?.foot;
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
