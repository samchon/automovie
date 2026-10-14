import {
  AutoMovieExpressionPreset,
  IAutoMovieExpression,
} from "@automovie/interface";

/**
 * Separate authored emotion from a sampled emission-clock mouth target.
 *
 * @evidence contracts/common.md#principled-implementation sampleAutoMovieDialogueExpression preserves the authored expression reference and derives only a closed mouth preset/intensity pair; rest and frames outside the joined half-open ranges produce neutral at zero intensity.
 * @evidence contracts/common.md#clear-and-simple-design Two explicit layers let a consumer compose mouth motion without replacing the authored emotion; this record does not itself apply either layer to an actor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing active range produces rest, without inventing an actor, emotion or audible-arrival offset; actual actor consumption remains unwired in the repository.
 * @evidence contracts/common.md#meaningful-documentation Identifies the borrowed authored reference, fresh mouth pair, closed preset and binary intensity policy rather than promising a merged expression.
 * @evidence contracts/performance.md#efficient-algorithms The record has constant size; its sampler scans R joined ranges in O(R) time and allocates one result and one mouth object.
 * @evidence contracts/performance.md#reuse-equivalent-work Authored emotion is shared unchanged while mouth state is recomputed from frame and ranges, so random seeks require no mutable playback cursor.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh result and mouth object; authored retains the supplied expression until the result is discarded, with no process or renderer handle.
 * @author Samchon
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
