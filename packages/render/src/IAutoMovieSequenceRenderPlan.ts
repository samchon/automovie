import type { IAutoMovieSequenceRenderShotSpan } from "./IAutoMovieSequenceRenderShotSpan";
import type { IAutoMovieSequenceRenderTransitionSpan } from "./IAutoMovieSequenceRenderTransitionSpan";
import type { IAutoMovieSequenceRenderFrame } from "./IAutoMovieSequenceRenderFrame";




/**
 * Public sequence render manifest: editorial timeline, transition spans, frame samples, output paths, and encoder args in one deterministic artifact.
 *
 * @evidence contracts/common.md#principled-implementation The manifest binds a sequence target to editorial and output fps, resolved spans, exact sample metadata, paths and encoding arguments from one planning call.
 * @evidence contracts/common.md#clear-and-simple-design Captures consume one complete manifest rather than independently deriving frame names, transitions and local shot times.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record preserves both frame clocks instead of pretending a render fps override changes the authored cut.
 * @evidence contracts/common.md#meaningful-documentation Members document seconds, fps roles, encode ordering, first and last paths and the shared ffmpeg argument vector.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The sequence manifest contract declares data and chooses no runtime algorithm; its producer documents construction cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased manifest performs no cache lookup or frame capture; planSequenceRender resolves one cut and renderSequenceVideo reuses that concrete plan during host execution.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased plan acquires no renderer; planSequenceRender creates frame and editorial-span arrays whose storage grows with output frames and entries and belongs to its caller.
 *
 * @author Samchon
 */
export interface IAutoMovieSequenceRenderPlan {
  /**
   * Render target identity.
   *
   * @author Samchon
   */
  target: { kind: "sequence"; id: string };

  /**
   * Sequence fps as authored by the cut.
   *
   * @author Samchon
   */
  sequenceFps: number;

  /**
   * Output fps from the render spec.
   *
   * @author Samchon
   */
  renderFps: number;

  /**
   * Total output seconds after transition overlaps are subtracted.
   *
   * @author Samchon
   */
  durationSeconds: number;

  /**
   * Number of output frames.
   *
   * @author Samchon
   */
  frameCount: number;

  /**
   * Global output sample times, one per frame.
   *
   * @author Samchon
   */
  times: number[];

  /**
   * Shot spans on the output clock.
   *
   * @author Samchon
   */
  shots: IAutoMovieSequenceRenderShotSpan[];

  /**
   * Incoming transition spans on the output clock.
   *
   * @author Samchon
   */
  transitionSpans: IAutoMovieSequenceRenderTransitionSpan[];

  /**
   * Frame samples in capture order.
   *
   * @author Samchon
   */
  frames: IAutoMovieSequenceRenderFrame[];

  /**
   * Directory where frame files should be written.
   *
   * @author Samchon
   */
  frameDir: string;

  /**
   * First output frame path.
   *
   * @author Samchon
   */
  firstFrame: string;

  /**
   * Last output frame path.
   *
   * @author Samchon
   */
  lastFrame: string;

  /**
   * Ffmpeg input pattern for the frame sequence.
   *
   * @author Samchon
   */
  inputPattern: string;

  /**
   * Encoded video output path.
   *
   * @author Samchon
   */
  outputPath: string;

  /**
   * Exact ffmpeg argument vector for the encoded output.
   *
   * @author Samchon
   */
  ffmpegArgs: string[];
}
