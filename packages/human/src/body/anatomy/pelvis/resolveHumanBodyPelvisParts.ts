import type { IAutoMovieHumanBodyPartResolution } from "../generated/IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "../generated/IAutoMovieHumanBodyRegionPartsInput";
import { humanBodyUnavailablePart } from "../generated/humanBodyUnavailablePart";
import type { IAutoMovieHumanBodyPelvisMeasurements } from "./IAutoMovieHumanBodyPelvisMeasurements";

/**
 * Answer the pelvic bones, ligaments, gluteal and iliopsoas muscles.
 *
 * No qualified pelvic internal-part generator is registered here. This resolver does not inspect `input.basis` for landmarks or tissue boundaries: its fixed `missing-bone-landmark` and `missing-tissue-boundary` reasons describe that generation limit rather than proving supplied-source absence. Pelvic breadth, depth and inter-head distances condition both coxal requests; combined iliopsoas volume conditions psoas and iliacus on its side. An observed value in each part's request takes precedence as `acquisition-not-registered` through `humanBodyUnavailablePart`. Exterior hip girth, breadth and buttock depth remain skin measurements and cannot satisfy internal parts.
 *
 * @evidence contracts/common.md#principled-implementation Fixed per-part unavailable causes expose unregistered pelvic generation; request-local observation detection preserves acquisition failure precedence without interpreting exterior dimensions as internal anatomy.
 * @evidence contracts/common.md#clear-and-simple-design One pelvis resolver names sixteen owned parts and delegates observation precedence to the shared unavailable-result helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The basis is not inspected, so fixed landmark/tissue reasons remain a generation limitation and cannot certify that the caller's source lacks those structures.
 * @evidence contracts/common.md#meaningful-documentation The prose states the unused basis, bilateral coxal conditioning, combined iliopsoas ownership and observed-request failure precedence.
 * @evidence contracts/performance.md#efficient-algorithms Sixteen result records are fixed-size; shared observation detection traverses only the relevant request subtrees, with some repeated scans for bilateral and combined quantities.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared coxal request tuple is reused across sides; no completed anatomical geometry exists to cache across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local request arrays end with the call and sixteen new unavailable records escape; no basis geometry or running task is retained.
 * @author Samchon
 */
export function resolveHumanBodyPelvisParts(
  input: IAutoMovieHumanBodyRegionPartsInput,
): readonly IAutoMovieHumanBodyPartResolution[] {
  const pelvis: IAutoMovieHumanBodyPelvisMeasurements | undefined =
    input.targets?.pelvis;
  const breadth: readonly unknown[] = [
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
