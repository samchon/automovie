import type {
  AutoMovieExpressionPreset,
  IAutoMovieExpression,
} from "@automovie/interface";

/** Authored expression and derived mouth layers at one frame. */
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
