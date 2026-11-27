import type {
  IAutoMovieExpression,
  IAutoMoviePose,
} from "@automovie/interface";

/** The deterministic state the {@link AutoMovieRenderPlayer} wrote this frame. */
export interface IAutoMovieRenderViewerFrame {
  /** Absolute clip time, in seconds. */
  seconds: number;

  /** Non-negative time since the previous player update, in seconds. */
  deltaSeconds: number;

  /** Pose applied to the model after clamping and secondary motion. */
  pose: IAutoMoviePose;

  /** Expression sampled for the same frame, or `null`. */
  expression: IAutoMovieExpression | null;
}
