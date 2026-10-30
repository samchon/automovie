import type { IAutoMovieHumanExpression } from "../../../human/src/structures/expression/IAutoMovieHumanExpression";
import { AutoMovieHumanActionUnit as Unit } from "../../../human/src/typings/AutoMovieHumanActionUnit";
import { AutoMovieHumanExpressionSide as Side } from "../../../human/src/typings/AutoMovieHumanExpressionSide";

/**
 * Cartoon demos expressed through the existing public FACS action units.
 * These deliberately strong combinations illustrate acting, not emotion recognition.
 *
 * Existing sided AU intensities combine the documented cheek/corner, brow/lid and jaw actions.
 * The page and controller can share these ordinary expression values without another schema.
 * The presets are named examples, never inferred emotions or supported-action guarantees.
 * Distinguishes exaggerated acting examples from recognition and anatomical validation.
 * A fixed data declaration selects no algorithm.
 * This declaration coordinates no effects.
 * The module retains four bounded ordinary input values and no native resource.
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
