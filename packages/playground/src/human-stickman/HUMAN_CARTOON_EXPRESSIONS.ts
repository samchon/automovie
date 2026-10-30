import type { IAutoMovieHumanExpression } from "../../../human/src/structures/expression/IAutoMovieHumanExpression";
import { AutoMovieHumanActionUnit as Unit } from "../../../human/src/typings/AutoMovieHumanActionUnit";
import { AutoMovieHumanExpressionSide as Side } from "../../../human/src/typings/AutoMovieHumanExpressionSide";

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
      { unit: Unit.CheekRaiser, intensity: 0.8, side: Side.Both },
      { unit: Unit.LipCornerPuller, intensity: 0.95, side: Side.Both },
    ],
  },
  angry: {
    units: [
      { unit: Unit.BrowLowerer, intensity: 1, side: Side.Both },
      { unit: Unit.LidTightener, intensity: 0.65, side: Side.Both },
      { unit: Unit.LipTightener, intensity: 0.9, side: Side.Both },
    ],
  },
  surprised: {
    units: [
      { unit: Unit.InnerBrowRaiser, intensity: 1, side: Side.Both },
      { unit: Unit.OuterBrowRaiser, intensity: 1, side: Side.Both },
      { unit: Unit.UpperLidRaiser, intensity: 1, side: Side.Both },
      { unit: Unit.JawDrop, intensity: 0.95, side: Side.Both },
    ],
  },
};
