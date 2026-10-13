import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import type { AutoMovieHumanBodyAnatomicalUnavailableReason } from "../generated/AutoMovieHumanBodyAnatomicalUnavailableReason";
import type { IAutoMovieHumanBodyShoulderMeasurements } from "./IAutoMovieHumanBodyShoulderMeasurements";
import type { IAutoMovieHumanBodyRotatorCuffMeasurements } from "./IAutoMovieHumanBodyRotatorCuffMeasurements";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer each side's clavicle, scapula, deltoid and rotator cuff muscles.
 *
 * No qualified internal shoulder generator is registered here. This function does not inspect the supplied basis: fixed bone-landmark and tissue-boundary reasons describe the generation limitation rather than proving source absence. Each side has clavicle, scapula, deltoid and four distinct cuff bellies; the cuff groups its members rather than adding a fifth muscle. Observed values in a part's request take precedence as `acquisition-not-registered`. A shoulder skin transform or biacromial surface breadth cannot resolve those internal parts.
 *
 * @evidence contracts/common.md#principled-implementation Fourteen side-specific unavailable records preserve each owned part and use request-local observation precedence while internal shoulder generation remains unregistered.
 * @evidence contracts/common.md#clear-and-simple-design Two sides share one fixed component mapping and the common unavailable-part helper; cuff grouping creates no extra material part.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed causes cannot attest missing caller-source landmarks because basis is unread; surface motion/breadth supplies no substitute internal anatomy.
 * @evidence contracts/common.md#meaningful-documentation The prose states unregistered generation, unused basis, separate cuff identities and observed-acquisition precedence.
 * @evidence contracts/performance.md#efficient-algorithms Fourteen output records have fixed size; observation checks traverse only their individual supplied measurement subtrees.
 * @evidence contracts/performance.md#reuse-equivalent-work Both sides reuse the same component logic, without sharing request-dependent failure records across bodies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local side arrays expire after flatMap and fourteen new unavailable results escape without retaining basis geometry.
 * @author Samchon
 */
export function resolveHumanBodyShoulderParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const muscle: AutoMovieHumanBodyAnatomicalUnavailableReason = "missing-tissue-boundary";
  return (["left", "right"] as const).flatMap((side: "left" | "right"): IAutoMovieHumanBodyPartResolution[] => {
    const shoulder: IAutoMovieHumanBodyShoulderMeasurements | undefined = input.targets?.[`${side}UpperLimb`]?.shoulder;
    const cuff: IAutoMovieHumanBodyRotatorCuffMeasurements | undefined = shoulder?.rotatorCuff;
    return [
      humanBodyUnavailablePart(
        `${side}Clavicle` as const,
        shoulder?.clavicle,
        "missing-bone-landmark",
      ),
      humanBodyUnavailablePart(
        `${side}Scapula` as const,
        shoulder?.scapula,
        "missing-bone-landmark",
      ),
      humanBodyUnavailablePart(
        `${side}Deltoid` as const,
        shoulder?.deltoid,
        muscle,
      ),
      humanBodyUnavailablePart(
        `${side}Supraspinatus` as const,
        cuff?.supraspinatus,
        muscle,
      ),
      humanBodyUnavailablePart(
        `${side}Infraspinatus` as const,
        cuff?.infraspinatus,
        muscle,
      ),
      humanBodyUnavailablePart(
        `${side}TeresMinor` as const,
        cuff?.teresMinor,
        muscle,
      ),
      humanBodyUnavailablePart(
        `${side}Subscapularis` as const,
        cuff?.subscapularis,
        muscle,
      ),
    ];
  });
}
