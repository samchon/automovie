import type { IAutoMovieHumanFaceAnatomicalParameters } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * Clinical skin observations retain site, side and scale identity.
 *
 * Scenarios:
 * 1. Distinct rest, contraction, fold and jawline grades coexist without
 *    reducing them to an age or a free wrinkle curve.
 * 2. A six-grade nasolabial score cannot be used as a four-grade upper line.
 */
export const test_subject_face_skin_condition_contract = (): void => {
  const face: IAutoMovieHumanFaceAnatomicalParameters = {
    referencePose: "eyes-open-forward-gaze-lips-apposed",
    jawReference: "maximum-intercuspation",
    skinCondition: {
      foreheadLines: { restGrade: 1, maximumContractionGrade: 3 },
      leftNasolabialFoldGrade: 5,
      rightNasolabialFoldGrade: 2,
      jawlineSaggingGrade: 1,
    },
  };
  TestValidator.equals(
    "ordinal protocols and laterality stay separate",
    [
      face.skinCondition?.foreheadLines?.restGrade,
      face.skinCondition?.foreheadLines?.maximumContractionGrade,
      face.skinCondition?.leftNasolabialFoldGrade,
      face.skinCondition?.rightNasolabialFoldGrade,
      face.skinCondition?.jawlineSaggingGrade,
    ],
    [1, 3, 5, 2, 1],
  );

  const invalid: IAutoMovieHumanFaceAnatomicalParameters = {
    referencePose: "eyes-open-forward-gaze-lips-apposed",
    jawReference: "maximum-intercuspation",
    skinCondition: {
      foreheadLines: {
        // @ts-expect-error Upper-line grades 0–3 cannot take fold grade 5.
        restGrade: 5,
      },
    },
  };
  void invalid;
};
