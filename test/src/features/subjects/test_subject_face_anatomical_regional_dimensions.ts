import type { IAutoMovieHumanFaceAnatomicalParameters } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * Region-specific measurements retain their anatomical acquisition names.
 *
 * Scenarios:
 * 1. Basal nostril axes, photographed neck section, palatal vault and MRI
 *    tongue-base cross-section coexist with fixed-light eye and measured motion
 *    without any personal geometry input.
 * 2. Missing measurements stay absent instead of acquiring a source mean.
 */
export const test_subject_face_anatomical_regional_dimensions = (): void => {
  const measured: IAutoMovieHumanFaceAnatomicalParameters = {
    referencePose: "eyes-open-forward-gaze-lips-apposed",
    jawReference: "maximum-intercuspation",
    nose: {
      leftNostrilLongAxisMm: 12,
      leftNostrilShortAxisMm: 6.6,
      rightNostrilLongAxisMm: 11.8,
      nostrilLongAxesAngleDegrees: 84,
    },
    neck: { neckWidthMm: 123, cricothyroidCircumferenceMm: 391 },
    eyes: {
      left: {
        pupilDiameterAt250LuxMm: 2.9,
        upperCreaseHeightMm: null,
        lowerEyelid: { orbitalFatProlapseGrade: 2, fluidGrade: 0 },
      },
      right: { upperCreaseHeightMm: 4.5 },
    },
    ears: { left: { tragusToAntihelixMm: 18, helixRimProfile: "rolled" } },
    mouth: {
      cupidBowCentralAngleDegrees: 135,
      leftCupidBowPeakHeightMm: 7,
      rightCupidBowPeakHeightMm: 6.5,
    },
    oralCavity: { properSpaceVolumeCm3: 4.4 },
    dentition: {
      stage: "permanent",
      maxillary: {
        palatalVaultWidthAtFirstMolarCejMm: 37,
        palatalVaultDepthAtFirstMolarCejMm: 16,
      },
      teeth: { "11": { state: "erupted", buccolingualCrownWidthMm: 7 } },
    },
    tongue: { posteriorBaseCoronal: { widthMm: 41, heightMm: 33 } },
    performance: { lipPurseMagnitudeMm: 4.2 },
  };
  TestValidator.equals(
    "distinct biological and acquisition dimensions",
    [
      measured.nose?.leftNostrilLongAxisMm,
      measured.nose?.leftNostrilShortAxisMm,
      measured.neck?.cricothyroidCircumferenceMm,
      measured.dentition?.maxillary?.palatalVaultDepthAtFirstMolarCejMm,
      measured.tongue?.posteriorBaseCoronal?.heightMm,
      measured.eyes?.left?.pupilDiameterAt250LuxMm,
      measured.performance?.lipPurseMagnitudeMm,
      measured.eyes?.left?.lowerEyelid?.orbitalFatProlapseGrade,
      measured.ears?.left?.tragusToAntihelixMm,
      measured.mouth?.rightCupidBowPeakHeightMm,
      measured.dentition?.teeth?.["11"]?.buccolingualCrownWidthMm,
      measured.oralCavity?.properSpaceVolumeCm3,
    ],
    [12, 6.6, 391, 16, 33, 2.9, 4.2, 2, 18, 6.5, 7, 4.4],
  );
  TestValidator.equals(
    "unobserved right short nostril axis remains unknown",
    measured.nose?.rightNostrilShortAxisMm,
    undefined,
  );
  TestValidator.equals(
    "observed absent crease differs from an unobserved one",
    [measured.eyes?.left?.upperCreaseHeightMm, measured.eyes?.right?.upperCreaseHeightMm],
    [null, 4.5],
  );

  const invalid: IAutoMovieHumanFaceAnatomicalParameters = {
    referencePose: "eyes-open-forward-gaze-lips-apposed",
    jawReference: "maximum-intercuspation",
    eyes: {
      left: {
        lowerEyelid: {
          // @ts-expect-error Goldberg contributor scores are ordinal 0–4.
          orbitalFatProlapseGrade: 5,
        },
      },
    },
  };
  void invalid;

  // @ts-expect-error The contrast-CBCT protocol seats the tip at lower incisors.
  const invalidOralReference: IAutoMovieHumanFaceAnatomicalParameters = {
    referencePose: "eyes-open-forward-gaze-lips-apposed",
    jawReference: "habitual-closure",
    dentition: { stage: "edentulous" },
    oralCavity: { properSpaceVolumeCm3: 4.4 },
  };
  void invalidOralReference;
};
