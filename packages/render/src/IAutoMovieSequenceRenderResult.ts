import { IAutoMovieSequenceRenderFrame } from "./IAutoMovieSequenceRenderFrame";
import { IAutoMovieSequenceRenderPlan } from "./IAutoMovieSequenceRenderPlan";

/**
 * The outcome of rendering a sequence through injected host I/O.
 *
 * @evidence contracts/common.md#principled-implementation The result records captured samples in encode order alongside the executed manifest, schedule and actual encoded path.
 * @evidence contracts/common.md#clear-and-simple-design Keeping the exact plan with captured frames lets inspection compare intended sequence samples with host-returned artifacts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Frame paths are capture results and the output is the encoder result; neither is guessed from a fixture or inferred pattern.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish global sample seconds, capture-order records, input pattern, directory and exact encoder arguments.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The executed sequence result shape declares data and chooses no runtime algorithm; its producer documents construction cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The captured sequence artifacts describes an identity boundary and performs no request coordination or result caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased sequence result closes no files or processes; renderSequenceVideo transfers captured-frame arrays and the plan manifest to its caller while host adapters own written media.
 */
export interface IAutoMovieSequenceRenderResult {
  /**
   * Path to the encoded video.
   */
  output: string;

  /**
   * Number of captured frames.
   */
  frameCount: number;

  /**
   * Global output sample times.
   */
  times: number[];

  /**
   * Captured frame samples in encode order.
   */
  frames: IAutoMovieSequenceRenderFrame[];

  /**
   * Directory passed through the manifest for frame files.
   */
  frameDir: string;

  /**
   * Ffmpeg input pattern for the captured frame sequence.
   */
  inputPattern: string;

  /**
   * Exact ffmpeg argument vector handed to the encode adapter.
   */
  ffmpegArgs: string[];

  /**
   * The deterministic sequence manifest that drove capture.
   */
  plan: IAutoMovieSequenceRenderPlan;
}
