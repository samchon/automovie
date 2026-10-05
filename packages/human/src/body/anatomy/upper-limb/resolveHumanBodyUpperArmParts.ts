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
 * @evidence contracts/common.md#principled-implementation Each part's reason names the source dependency the connected exterior lacks.
 * @evidence contracts/common.md#clear-and-simple-design One answer per owned part from that part's own request subtree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One arm girth or bone length never produces a muscle contour or humerus.
 * @evidence contracts/common.md#meaningful-documentation States each reason and why the humeral-head candidate is not a humerus.
 * @evidence contracts/modeling.md#part-identity-and-grouping Owns each side's humerus, biceps brachii, brachialis and triceps brachii.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It reads no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The exterior builder owns the shared skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The exterior consumer displays the answers.
 * @evidence contracts/anatomy.md#anatomical-source The reasons state what the source lacks; no anatomical value is asserted.
 * @evidence contracts/anatomy.md#permitted-range Unregistered observations refuse with their cause and the request is left unchanged.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export function resolveHumanBodyUpperArmParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const muscle = "missing-tissue-boundary" as const;
  return (["left", "right"] as const).flatMap((side) => {
    const arm = input.targets?.[`${side}UpperLimb`]?.upperArm;
    return [
      humanBodyUnavailablePart(`${side}Humerus` as const, arm?.humerus, "missing-bone-landmark"),
      humanBodyUnavailablePart(`${side}BicepsBrachii` as const, arm?.bicepsBrachii, muscle),
      humanBodyUnavailablePart(`${side}Brachialis` as const, arm?.brachialis, muscle),
      humanBodyUnavailablePart(`${side}TricepsBrachii` as const, arm?.tricepsBrachii, muscle),
    ];
  });
}
