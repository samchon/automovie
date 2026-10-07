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
 * @evidence contracts/common.md#principled-implementation Each part's reason names the source dependency the connected exterior lacks.
 * @evidence contracts/common.md#clear-and-simple-design One answer per owned part from that part's own request subtree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A combined forearm girth never decides two bone lengths or a muscle composition.
 * @evidence contracts/common.md#meaningful-documentation States each reason and why the skin twist is not a radioulnar joint.
 * @evidence contracts/modeling.md#part-identity-and-grouping Owns each side's radius, ulna, brachioradialis, flexor digitorum superficialis and extensor digitorum.
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
