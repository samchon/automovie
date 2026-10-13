import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import type { AutoMovieHumanBodyAnatomicalUnavailableReason } from "../generated/AutoMovieHumanBodyAnatomicalUnavailableReason";
import type { IAutoMovieHumanBodyUpperArmMeasurements } from "./IAutoMovieHumanBodyUpperArmMeasurements";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer each side's humerus, biceps brachii, brachialis and triceps brachii.
 *
 * No qualified full-humerus or upper-arm-muscle generator is registered by this resolver. Its fixed landmark/tissue causes do not establish source absence because the supplied basis is unread. The separate articular-head sphere remains a candidate radius at a posed rig center rather than a complete humerus. Each side's humerus, biceps, brachialis and triceps remains unavailable, with observed request values receiving `acquisition-not-registered` precedence; skin girth or shoulder-elbow length cannot satisfy those parts.
 *
 * @evidence contracts/common.md#principled-implementation Eight named unavailable results preserve side-specific upper-arm anatomy and acquisition precedence while qualified full-bone/tissue generation remains unregistered.
 * @evidence contracts/common.md#clear-and-simple-design A bilateral four-component mapping delegates observed detection to the shared unavailable helper and keeps the head-sphere owner separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unread basis cannot certify missing anatomy, and articular spheres or skin dimensions cannot substitute for a full humerus or muscle boundary.
 * @evidence contracts/common.md#meaningful-documentation The prose gives unused-basis limitations, candidate-head scope, component identities and observed-request failure precedence.
 * @evidence contracts/performance.md#efficient-algorithms Eight fixed-size outputs inspect only their respective measurement subtrees for observations; no bone-array or source-surface traversal occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Both upper arms share mapping and failure precedence without reusing request-dependent result identities across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary arrays are call-local; eight new unavailable records escape without retaining bones, skin buffers or generator tasks.
 * @author Samchon
 */
export function resolveHumanBodyUpperArmParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const muscle: AutoMovieHumanBodyAnatomicalUnavailableReason = "missing-tissue-boundary";
  return (["left", "right"] as const).flatMap((side: "left" | "right"): IAutoMovieHumanBodyPartResolution[] => {
    const arm: IAutoMovieHumanBodyUpperArmMeasurements | undefined = input.targets?.[`${side}UpperLimb`]?.upperArm;
    return [
      humanBodyUnavailablePart(
        `${side}Humerus` as const,
        arm?.humerus,
        "missing-bone-landmark",
      ),
      humanBodyUnavailablePart(
        `${side}BicepsBrachii` as const,
        arm?.bicepsBrachii,
        muscle,
      ),
      humanBodyUnavailablePart(
        `${side}Brachialis` as const,
        arm?.brachialis,
        muscle,
      ),
      humanBodyUnavailablePart(
        `${side}TricepsBrachii` as const,
        arm?.tricepsBrachii,
        muscle,
      ),
    ];
  });
}
