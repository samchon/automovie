import type { IAutoMovieSequenceRenderFrame } from "./IAutoMovieSequenceRenderFrame.js";
import type { IAutoMovieSequenceRenderShotSpan } from "./IAutoMovieSequenceRenderShotSpan.js";
import type { IAutoMovieSequenceRenderTransitionSpan } from "./IAutoMovieSequenceRenderTransitionSpan.js";

/**
 * Public sequence render manifest: editorial timeline, transition spans, frame samples, output paths, and encoder args in one deterministic artifact.
 *
 * @evidence contracts/development/design.md#principled-representation The manifest binds a sequence target to editorial and output fps, resolved spans, exact sample metadata, paths and encoding arguments from one planning call.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Captures consume one complete manifest rather than independently deriving frame names, transitions and local shot times.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record preserves both frame clocks instead of pretending a render fps override changes the authored cut.
 * @evidence contracts/development/common.md#meaningful-documentation Members document seconds, fps roles, encode ordering, first and last paths and the shared ffmpeg argument vector.
 */
export interface IAutoMovieSequenceRenderPlan {
  /**
   * Render target identity.
   */
  target: { kind: "sequence"; id: string };

  /**
   * Sequence fps as authored by the cut.
   */
  sequenceFps: number;

  /**
   * Output fps from the render spec.
   */
  renderFps: number;

  /**
   * Total output seconds after transition overlaps are subtracted.
   */
  durationSeconds: number;

  /**
   * Number of output frames.
   */
  frameCount: number;

  /**
   * Global output sample times, one per frame.
   */
  times: number[];

  /**
   * Shot spans on the output clock.
   */
  shots: IAutoMovieSequenceRenderShotSpan[];

  /**
   * Incoming transition spans on the output clock.
   */
  transitionSpans: IAutoMovieSequenceRenderTransitionSpan[];

  /**
   * Frame samples in capture order.
   */
  frames: IAutoMovieSequenceRenderFrame[];

  /**
   * Directory where frame files should be written.
   */
  frameDir: string;

  /**
   * First output frame path.
   */
  firstFrame: string;

  /**
   * Last output frame path.
   */
  lastFrame: string;

  /**
   * Ffmpeg input pattern for the frame sequence.
   */
  inputPattern: string;

  /**
   * Encoded video output path.
   */
  outputPath: string;

  /**
   * Exact ffmpeg argument vector for the encoded output.
   */
  ffmpegArgs: string[];
}
