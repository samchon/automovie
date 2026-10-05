import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer each side's patella.
 *
 * The connected source registers no patellar landmark (the midpatella of
 * ANSUR 6.4.57 knee height), and its knee is a rig hinge, so each patella is
 * `missing-bone-landmark`. The femoral condyles and tibial plateau belong to
 * the thigh and leg regions and are not duplicated here. An observed value in
 * the patella's request refuses it as `acquisition-not-registered`.
 *
 * @evidence contracts/common.md#principled-implementation The reason names the landmark the connected exterior source lacks.
 * @evidence contracts/common.md#clear-and-simple-design One answer per side from that side's own request subtree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A hinge's flexion is not read as a patellar track.
 * @evidence contracts/common.md#meaningful-documentation States the reason and the condyle and plateau ownership.
 * @evidence contracts/modeling.md#part-identity-and-grouping Owns each side's patella only; femur and tibia stay with their regions.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It reads no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The exterior builder owns the shared skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The exterior consumer displays the answers.
 * @evidence contracts/anatomy.md#anatomical-source The reason states what the source lacks; no anatomical value is asserted.
 * @evidence contracts/anatomy.md#permitted-range Unregistered observations refuse with their cause and the request is left unchanged.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export function resolveHumanBodyKneeParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  return [
    humanBodyUnavailablePart("leftPatella", input.targets?.leftLowerLimb?.knee?.patella, "missing-bone-landmark"),
    humanBodyUnavailablePart("rightPatella", input.targets?.rightLowerLimb?.knee?.patella, "missing-bone-landmark"),
  ];
}
