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
 * @author Samchon
 */
export function resolveHumanBodyKneeParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  return [
    humanBodyUnavailablePart(
      "leftPatella",
      input.targets?.leftLowerLimb?.knee?.patella,
      "missing-bone-landmark",
    ),
    humanBodyUnavailablePart(
      "rightPatella",
      input.targets?.rightLowerLimb?.knee?.patella,
      "missing-bone-landmark",
    ),
  ];
}
