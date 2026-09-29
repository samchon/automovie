import type { IAutoMovieHumanFaceAnatomicalParameters } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * Anatomically named appearance actions retain ordinal and side semantics.
 *
 * Scenarios:
 * 1. Asymmetric cheek/lip actions coexist with the observed midline jaw
 *    action and the separate metric incisal opening.
 * 2. An arbitrary continuous morph weight is excluded from the FACS scale.
 */
export const test_subject_face_action_contract = (): void => {
  const face: IAutoMovieHumanFaceAnatomicalParameters = {
    referencePose: "eyes-open-forward-gaze-lips-apposed",
    jawReference: "maximum-intercuspation",
    performance: {
      actions: {
        left: { cheekRaise: "C", lipCornerPull: "B" },
        right: { cheekRaise: "A", lipCornerPull: "none" },
        midline: { jawDrop: "B" },
      },
      jaw: { interincisalGapMm: 12 },
    },
  };
  TestValidator.equals(
    "categorical and measured actions remain distinct",
    [
      face.performance?.actions?.left?.cheekRaise,
      face.performance?.actions?.right?.cheekRaise,
      face.performance?.actions?.midline?.jawDrop,
      face.performance?.jaw?.interincisalGapMm,
    ],
    ["C", "A", "B", 12],
  );

  const invalid: IAutoMovieHumanFaceAnatomicalParameters = {
    referencePose: "eyes-open-forward-gaze-lips-apposed",
    jawReference: "maximum-intercuspation",
    performance: {
      actions: {
        left: {
          // @ts-expect-error A blendshape weight is not a FACS intensity.
          cheekRaise: 0.6,
        },
      },
    },
  };
  void invalid;
};
