import type { IAutoMovieHumanFaceAnatomicalParameters } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/** A measured face can omit unknown tissue while excluding personal sculpt data. */
export const test_subject_face_anatomical_parameter_contract = (): void => {
  const measured: IAutoMovieHumanFaceAnatomicalParameters = {
    referencePose: "eyes-open-forward-gaze-lips-apposed",
    jawReference: "maximum-intercuspation",
    craniofacial: { bizygomaticWidthMm: 137.2 },
    eyes: { left: { fissureLengthMm: 30.1 }, right: { fissureLengthMm: 29.7 } },
    dentition: { stage: "permanent", teeth: { "11": { state: "erupted" } } },
    scalpHair: {
      biology: { frontal: { terminalHairsPerCm2: 154 } },
      arrangement: {
        part: { side: "left", offsetMm: 4, reachMm: 70 },
        gather: { anchorRegion: "occipital", tailLengthMm: 120 },
        bangs: "absent",
        flow: { top: "parting", leftSide: "pulled-back" },
      },
    },
  };
  TestValidator.equals(
    "known left and right values stay independent",
    [
      measured.eyes?.left?.fissureLengthMm,
      measured.eyes?.right?.fissureLengthMm,
    ],
    [30.1, 29.7],
  );
  TestValidator.equals(
    "unseen tongue stays unknown",
    measured.tongue,
    undefined,
  );

  const directSculpt: IAutoMovieHumanFaceAnatomicalParameters = {
    referencePose: "eyes-open-forward-gaze-lips-apposed",
    jawReference: "maximum-intercuspation",
    // @ts-expect-error A personal vertex population is not an anatomical input.
    vertices: [0, 0, 0],
  };
  const groomSculpt: IAutoMovieHumanFaceAnatomicalParameters = {
    referencePose: "eyes-open-forward-gaze-lips-apposed",
    jawReference: "maximum-intercuspation",
    scalpHair: {
      // @ts-expect-error Hair cards are output representation, not authored input.
      cards: [{ points: [[0, 0, 0]] }],
    },
  };
  const invalidTooth: IAutoMovieHumanFaceAnatomicalParameters = {
    referencePose: "eyes-open-forward-gaze-lips-apposed",
    jawReference: "maximum-intercuspation",
    dentition: {
      // @ts-expect-error Tooth positions are a closed dental notation.
      teeth: { "99": { state: "erupted" } },
    },
  };
  void directSculpt;
  void groomSculpt;
  void invalidTooth;
};
