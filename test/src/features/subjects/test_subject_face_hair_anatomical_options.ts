import type { IAutoMovieHumanFaceAnatomicalParameters } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * Scalp biology and coarse styling compose without authored strand geometry.
 *
 * Scenarios:
 * 1. A source-classified frontal and temporal hairline, observed whorl,
 *    regional flow, part and gathering coexist in one typed document.
 * 2. An unclassified free hairline label cannot enter the closed taxonomy.
 */
export const test_subject_face_hair_anatomical_options = (): void => {
  const face: IAutoMovieHumanFaceAnatomicalParameters = {
    referencePose: "eyes-open-forward-gaze-lips-apposed",
    jawReference: "maximum-intercuspation",
    scalpHair: {
      hairline: {
        outline: "linear",
        leftTemporalOutline: "inverted-round",
        rightTemporalOutline: "convex",
      },
      whorls: [{ region: "vertex", pattern: "clockwise" }],
      arrangement: {
        part: { side: "left", offsetMm: 4, reachMm: 70 },
        gather: { anchorRegion: "occipital", tailLengthMm: 120 },
        bangs: "absent",
        flow: { top: "parting", leftSide: "pulled-back" },
      },
    },
  };
  TestValidator.equals(
    "observed whorl and independent styling categories",
    [
      face.scalpHair?.hairline?.leftTemporalOutline,
      face.scalpHair?.whorls?.[0]?.pattern,
      face.scalpHair?.arrangement?.part?.side,
      face.scalpHair?.arrangement?.gather?.anchorRegion,
    ],
    ["inverted-round", "clockwise", "left", "occipital"],
  );

  const invalid: IAutoMovieHumanFaceAnatomicalParameters = {
    referencePose: "eyes-open-forward-gaze-lips-apposed",
    jawReference: "maximum-intercuspation",
    scalpHair: {
      hairline: {
        // @ts-expect-error Named hairline classes cannot be replaced by free labels.
        outline: "custom-spline",
      },
    },
  };
  void invalid;
};
