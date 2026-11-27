import type { IAutoMovieExpression } from "../expression/IAutoMovieExpression";
import type { IAutoMovieHumanVisemeWeights } from "../human/IAutoMovieHumanVisemeWeights";

/**
 * Authored emotion kept apart from the sampled dialogue mouth that layers over
 * it (`mouth-layer-over-authored-expression`).
 */
export interface IAutoMovieDialogueExpressionLayers {
  /** Unchanged authored expression layer. */
  authored: IAutoMovieExpression | null;

  /** The mouth at the sampled frame. */
  mouth: {
    /** Coarticulated MPEG-4 viseme weights, each in [0, 1] and summing to 1. */
    visemes: IAutoMovieHumanVisemeWeights;
  };
}
