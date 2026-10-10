import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer each side's humerus, biceps brachii, brachialis and triceps brachii.
 *
 * The connected source's shoulder and elbow points are rig joint centres; it
 * registers no humeral head surface, epicondyles or trochlea, so the humerus
 * is `missing-bone-landmark`. The articular inspection's humeral-head sphere
 * is a candidate radius in a reference rig, not a humerus. The one exterior
 * skin holds no muscle boundary, so the biceps, brachialis and triceps are
 * `missing-tissue-boundary`. An observed value in a part's request refuses
 * it as `acquisition-not-registered`. The mid-upper-arm girth and the
 * shoulder-to-elbow length belong to the skin.
 *
 * @author Samchon
 */
export function resolveHumanBodyUpperArmParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const muscle = "missing-tissue-boundary" as const;
  return (["left", "right"] as const).flatMap((side) => {
    const arm = input.targets?.[`${side}UpperLimb`]?.upperArm;
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
