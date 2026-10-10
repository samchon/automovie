import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer each side's radius, ulna, brachioradialis, flexor digitorum
 * superficialis and extensor digitorum.
 *
 * The connected source's elbow and wrist points are rig joint centres; it
 * registers no radial head, olecranon or styloid process, so the radius and
 * ulna are `missing-bone-landmark`. The source's forearm twist distributes a
 * skin rotation along one lower-arm bone and is no radioulnar articulation.
 * The one exterior skin holds no muscle boundary, so the three forearm
 * muscles are `missing-tissue-boundary`. An observed value in a part's
 * request refuses it as `acquisition-not-registered`. The forearm and wrist
 * girths and the elbow-to-wrist length belong to the skin.
 *
 * @author Samchon
 */
export function resolveHumanBodyForearmParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const muscle = "missing-tissue-boundary" as const;
  return (["left", "right"] as const).flatMap((side) => {
    const forearm = input.targets?.[`${side}UpperLimb`]?.forearm;
    return [
      humanBodyUnavailablePart(
        `${side}Radius` as const,
        forearm?.radius,
        "missing-bone-landmark",
      ),
      humanBodyUnavailablePart(
        `${side}Ulna` as const,
        forearm?.ulna,
        "missing-bone-landmark",
      ),
      humanBodyUnavailablePart(
        `${side}Brachioradialis` as const,
        forearm?.brachioradialis,
        muscle,
      ),
      humanBodyUnavailablePart(
        `${side}FlexorDigitorumSuperficialis` as const,
        forearm?.flexorDigitorumSuperficialis,
        muscle,
      ),
      humanBodyUnavailablePart(
        `${side}ExtensorDigitorum` as const,
        forearm?.extensorDigitorum,
        muscle,
      ),
    ];
  });
}
