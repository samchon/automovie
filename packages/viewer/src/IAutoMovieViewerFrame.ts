import type {
  IAutoMovieExpression,
  IAutoMoviePose,
} from "@automovie/interface";

/**
 * The deterministic state an {@link AutoMoviePlayer} just wrote this frame.
 *
 * @evidence requirements/motion/timing-and-semantic-events.md#motion-boundary-sampling Carries the state sampled at one exact playback boundary.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clock-semantic-event Keeps time, pose, and expression on the same motion-clock sample.
 * @author Samchon
 */
export interface IAutoMovieViewerFrame {
  /**
   * Absolute clip time, in seconds.
   *
   * @evidence requirements/motion/timing-and-semantic-events.md#motion-boundary-sampling Records the exact absolute playback boundary.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clock-semantic-event Expresses that boundary on the shared motion clock.
   */
  seconds: number;

  /**
   * Non-negative time since the previous player update, in seconds.
   *
   * @evidence requirements/motion/timing-and-semantic-events.md#motion-boundary-sampling Records the non-negative interval from the prior playback boundary.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clock-semantic-event Keeps that interval on the same motion-clock sample.
   */
  deltaSeconds: number;

  /**
   * Pose applied to the model after clamping and secondary motion.
   *
   * @evidence requirements/motion/timing-and-semantic-events.md#motion-boundary-sampling Carries the pose resolved for this exact playback boundary.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clock-semantic-event Keeps the pose on the frame's shared motion-clock sample.
   */
  pose: IAutoMoviePose;

  /**
   * Expression sampled for the same frame, or `null`.
   *
   * @evidence requirements/motion/timing-and-semantic-events.md#motion-boundary-sampling Carries the expression resolved for this exact playback boundary.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clock-semantic-event Keeps the expression on the frame's shared motion-clock sample.
   */
  expression: IAutoMovieExpression | null;
}
