import type { IAutoMovieHumanFaceAnatomicalParameters } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * Distinct observed landmark protocols cannot be exchanged by a typed author.
 *
 * Scenarios:
 * 1. A maxillary cusp width and mandibular groove width remain independently
 *    named in one permanent dentition document.
 * 2. A mandibular groove width placed in the maxillary arch is rejected at
 *    compile time, before any source-basis lowering is attempted.
 */
export const test_subject_face_anatomical_measurement_protocols = (): void => {
  const measured: IAutoMovieHumanFaceAnatomicalParameters = {
    referencePose: "eyes-open-forward-gaze-lips-apposed",
    jawReference: "maximum-intercuspation",
    craniofacial: { nasionSubnasalePogonionAngleDegrees: 163 },
    brows: { left: { upperArchApexRiseMm: 3.4 } },
    dentition: {
      stage: "permanent",
      maxillary: { firstMolarMesiobuccalCuspWidthMm: 49 },
      mandibular: {
        firstMolarBuccalGrooveWidthMm: 45,
        firstMolarFacialAxisDepthMm: 27,
      },
    },
  };
  TestValidator.equals(
    "distinct first-molar protocols",
    [
      measured.dentition?.maxillary?.firstMolarMesiobuccalCuspWidthMm,
      measured.dentition?.mandibular?.firstMolarBuccalGrooveWidthMm,
    ],
    [49, 45],
  );

  const invalid: IAutoMovieHumanFaceAnatomicalParameters = {
    referencePose: "eyes-open-forward-gaze-lips-apposed",
    jawReference: "maximum-intercuspation",
    dentition: {
      stage: "permanent",
      maxillary: {
        // @ts-expect-error Buccal-groove width belongs to the mandibular arch.
        firstMolarBuccalGrooveWidthMm: 45,
      },
    },
  };
  void invalid;
};
