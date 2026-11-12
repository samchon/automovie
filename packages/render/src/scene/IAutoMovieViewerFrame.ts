import type {
  IAutoMovieExpression,
  IAutoMoviePose,
} from "@automovie/interface";

/**
 * The deterministic state an {@link AutoMoviePlayer} just wrote this frame.
 *
 * @evidence contracts/development/design.md#principled-representation Pairs absolute clip time and nonnegative update delta with the actual pose after optional clamping/springs and the expression sampled on the same clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One frame value lets imported-runtime callbacks observe applied state without resampling motion or inspecting mutable bone objects.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The callback receives applied pose rather than an unclamped target, and a backward timestamp does not become a negative runtime delta.
 * @evidence contracts/development/common.md#meaningful-documentation Documents seconds, nonnegative delta, post-clamp/secondary pose and nullable synchronized expression.
 */
export interface IAutoMovieViewerFrame {
  /** Absolute clip time, in seconds. */
  seconds: number;

  /** Non-negative time since the previous player update, in seconds. */
  deltaSeconds: number;

  /** Pose applied to the model after clamping and secondary motion. */
  pose: IAutoMoviePose;

  /** Expression sampled for the same frame, or `null`. */
  expression: IAutoMovieExpression | null;
}
