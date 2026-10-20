import type {
  IAutoMovieExpression,
  IAutoMoviePose,
} from "@automovie/interface";

/**
 * The deterministic state an {@link AutoMoviePlayer} just wrote this frame.
 *
 * @evidence contracts/common.md#principled-implementation Pairs absolute clip time and nonnegative update delta with the actual pose after optional clamping/springs and the expression sampled on the same clock.
 * @evidence contracts/common.md#clear-and-simple-design One frame value lets imported-runtime callbacks observe applied state without resampling motion or inspecting mutable bone objects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback receives applied pose rather than an unclamped target, and a backward timestamp does not become a negative runtime delta.
 * @evidence contracts/common.md#meaningful-documentation Documents seconds, nonnegative delta, post-clamp/secondary pose and nullable synchronized expression.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This frame value does not choose sampling, integration or application algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every player update publishes its current frame; this shape coordinates no result reuse across different times or clip effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The frame contains numerical pose/expression records and acquires no render loop, skeleton object or native allocation.
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
