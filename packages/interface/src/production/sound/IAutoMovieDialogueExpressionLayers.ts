import type { AutoMovieExpressionPreset } from "../../expression/AutoMovieExpressionPreset";
import type { IAutoMovieExpression } from "../../expression/IAutoMovieExpression";

/**
 * Separate authored emotion from a sampled emission-clock mouth target.
 */
export interface IAutoMovieDialogueExpressionLayers {
  /** Unchanged authored expression layer. */
  authored: IAutoMovieExpression | null;

  /** Derived mouth-only preset. */
  mouth: {
    /** Mouth preset, with `neutral` representing receipt `rest`. */
    preset: AutoMovieExpressionPreset;

    /** Zero for rest and one for an active viseme. */
    intensity: number;
  };
}
