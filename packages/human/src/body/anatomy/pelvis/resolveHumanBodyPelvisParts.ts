import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";

/**
 * Answer the pelvic bones, ligaments, gluteal and iliopsoas muscles.
 *
 * The connected source is one exterior skin. It registers no sacral, coccygeal
 * or iliac-spine landmark (ASIS, PSIS), so the sacrum, coccyx and coxal bones
 * are `missing-bone-landmark`; the pelvic breadth, depth and inter-head
 * distance requests condition the coxal bones they are measured on. It holds
 * no boundary between skin, fat and muscle, so each gluteal muscle, the psoas
 * major, the iliacus and the sacrotuberous ligament are
 * `missing-tissue-boundary`. A combined iliopsoas volume conditions both of
 * its muscles. An observed value in a part's request refuses that part as
 * `acquisition-not-registered` (`humanBodyUnavailablePart`). The hip girth,
 * breadth and buttock depth the exterior answers belong to the skin, not to
 * these parts.
 *
 * @evidence contracts/common.md#principled-implementation Each part's reason names the source dependency the connected exterior source lacks, rather than one generic failure.
 * @evidence contracts/common.md#clear-and-simple-design One answer per owned part from that part's own request subtree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplied targets never produce a pelvic part without a generator.
 * @evidence contracts/common.md#meaningful-documentation States each reason and which requests condition which part.
 * @evidence contracts/modeling.md#part-identity-and-grouping Owns sacrum, coccyx, both coxal bones, sacrotuberous ligaments, gluteal muscles, psoas major and iliacus, and no thigh or trunk part.
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
export function resolveHumanBodyPelvisParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const pelvis = input.targets?.pelvis;
  const breadth = [
    pelvis?.interAnteriorSuperiorIliacSpineDistance,
    pelvis?.anteriorPosteriorIliacSpineMidpointDepth,
    pelvis?.interFemoralHeadDistance,
  ];
  return [
    humanBodyUnavailablePart("sacrum", pelvis?.sacrum, "missing-bone-landmark"),
    humanBodyUnavailablePart("coccyx", pelvis?.coccyx, "missing-bone-landmark"),
    humanBodyUnavailablePart(
      "leftCoxalBone",
      [pelvis?.leftCoxalBone, breadth],
      "missing-bone-landmark",
    ),
    humanBodyUnavailablePart(
      "rightCoxalBone",
      [pelvis?.rightCoxalBone, breadth],
      "missing-bone-landmark",
    ),
    humanBodyUnavailablePart(
      "leftSacrotuberousLigament",
      pelvis?.leftSacrotuberousLigament,
      "missing-tissue-boundary",
    ),
    humanBodyUnavailablePart(
      "rightSacrotuberousLigament",
      pelvis?.rightSacrotuberousLigament,
      "missing-tissue-boundary",
    ),
    humanBodyUnavailablePart(
      "leftGluteusMaximus",
      pelvis?.leftHip?.gluteusMaximus,
      "missing-tissue-boundary",
    ),
    humanBodyUnavailablePart(
      "rightGluteusMaximus",
      pelvis?.rightHip?.gluteusMaximus,
      "missing-tissue-boundary",
    ),
    humanBodyUnavailablePart(
      "leftGluteusMedius",
      pelvis?.leftHip?.gluteusMedius,
      "missing-tissue-boundary",
    ),
    humanBodyUnavailablePart(
      "rightGluteusMedius",
      pelvis?.rightHip?.gluteusMedius,
      "missing-tissue-boundary",
    ),
    humanBodyUnavailablePart(
      "leftGluteusMinimus",
      pelvis?.leftHip?.gluteusMinimus,
      "missing-tissue-boundary",
    ),
    humanBodyUnavailablePart(
      "rightGluteusMinimus",
      pelvis?.rightHip?.gluteusMinimus,
      "missing-tissue-boundary",
    ),
    humanBodyUnavailablePart(
      "leftPsoasMajor",
      [
        pelvis?.leftHip?.iliopsoas?.psoasMajor,
        pelvis?.leftHip?.iliopsoas?.combinedMuscleVolume,
      ],
      "missing-tissue-boundary",
    ),
    humanBodyUnavailablePart(
      "rightPsoasMajor",
      [
        pelvis?.rightHip?.iliopsoas?.psoasMajor,
        pelvis?.rightHip?.iliopsoas?.combinedMuscleVolume,
      ],
      "missing-tissue-boundary",
    ),
    humanBodyUnavailablePart(
      "leftIliacus",
      [
        pelvis?.leftHip?.iliopsoas?.iliacus,
        pelvis?.leftHip?.iliopsoas?.combinedMuscleVolume,
      ],
      "missing-tissue-boundary",
    ),
    humanBodyUnavailablePart(
      "rightIliacus",
      [
        pelvis?.rightHip?.iliopsoas?.iliacus,
        pelvis?.rightHip?.iliopsoas?.combinedMuscleVolume,
      ],
      "missing-tissue-boundary",
    ),
  ];
}
