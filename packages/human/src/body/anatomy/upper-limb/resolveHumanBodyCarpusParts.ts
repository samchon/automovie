import type { AutoMovieHumanBodyAnatomicalUnavailableReason } from "../generated/AutoMovieHumanBodyAnatomicalUnavailableReason";
import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";
import type { IAutoMovieHumanBodyCarpusMeasurements } from "./IAutoMovieHumanBodyCarpusMeasurements";

/**
 * Answer each side's eight carpal bones.
 *
 * No qualified carpal generator is registered here. The fixed bone-landmark cause does not establish absence on the supplied basis, which this resolver never inspects. Eight separately named bones on each side remain unavailable, and an observed value in its own request takes precedence as `acquisition-not-registered`. Whole-hand dimensions or a hand transform cannot satisfy radiocarpal/midcarpal anatomy or kinematics.
 *
 * @evidence contracts/common.md#principled-implementation Sixteen individually named unavailable carpal results preserve side and bone identity with shared request-local observed-acquisition precedence.
 * @evidence contracts/common.md#clear-and-simple-design One bilateral component mapping and the common unavailable helper own wrist reporting without generating surrogate bones.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Basis is unread, so the fixed missing-landmark result cannot certify source absence or convert a hand transform into validated carpal kinematics.
 * @evidence contracts/common.md#meaningful-documentation The prose gives unregistered generation, eight bones per side and observation precedence without claiming inspected source anatomy.
 * @evidence contracts/performance.md#efficient-algorithms Sixteen outputs are fixed-size; observation checks traverse only the individual supplied carpal measurement subtrees.
 * @evidence contracts/performance.md#reuse-equivalent-work Both wrists share the component mapping and unavailable helper, without caching failures across different bone requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Side arrays are local and sixteen new failure records escape; no carpal mesh or borrowed basis is retained.
 * @author Samchon
 */
export function resolveHumanBodyCarpusParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const bone: AutoMovieHumanBodyAnatomicalUnavailableReason =
    "missing-bone-landmark";
  return (["left", "right"] as const).flatMap(
    (side: "left" | "right"): IAutoMovieHumanBodyPartResolution[] => {
      const carpus: IAutoMovieHumanBodyCarpusMeasurements | undefined =
        input.targets?.[`${side}UpperLimb`]?.hand?.carpus;
      return [
        humanBodyUnavailablePart(
          `${side}Scaphoid` as const,
          carpus?.scaphoid,
          bone,
        ),
        humanBodyUnavailablePart(
          `${side}Lunate` as const,
          carpus?.lunate,
          bone,
        ),
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
        humanBodyUnavailablePart(
          `${side}Hamate` as const,
          carpus?.hamate,
          bone,
        ),
      ];
    },
  );
}
