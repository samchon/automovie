import type { IAutoMovieHumanExpression } from "../../../human/src/structures/expression/IAutoMovieHumanExpression";

/**
 * Cartoon demos expressed through the existing public FACS action units.
 * These deliberately strong combinations illustrate acting, not emotion recognition.
 *
 * @evidence contracts/common.md#principled-implementation Existing sided AU intensities combine the documented cheek/corner, brow/lid and jaw actions.
 * @evidence contracts/common.md#clear-and-simple-design The page and controller can share these ordinary expression values without another schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The presets are named examples, never inferred emotions or supported-action guarantees.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes exaggerated acting examples from recognition and anatomical validation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A fixed data declaration selects no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The module retains four bounded ordinary input values and no native resource.
 */
export const HUMAN_CARTOON_EXPRESSIONS: Record<
  string,
  IAutoMovieHumanExpression
> = {
  neutral: { units: [] },
  happy: {
    units: [
      { unit: "cheekRaiser", intensity: 0.8, side: "both" },
      { unit: "lipCornerPuller", intensity: 0.95, side: "both" },
    ],
  },
  angry: {
    units: [
      { unit: "browLowerer", intensity: 1, side: "both" },
      { unit: "lidTightener", intensity: 0.65, side: "both" },
      { unit: "lipTightener", intensity: 0.9, side: "both" },
    ],
  },
  surprised: {
    units: [
      { unit: "innerBrowRaiser", intensity: 1, side: "both" },
      { unit: "outerBrowRaiser", intensity: 1, side: "both" },
      { unit: "upperLidRaiser", intensity: 1, side: "both" },
      { unit: "jawDrop", intensity: 0.95, side: "both" },
    ],
  },
};
