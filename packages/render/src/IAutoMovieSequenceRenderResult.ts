import { IAutoMovieSequenceRenderFrame } from "./IAutoMovieSequenceRenderFrame.js";
import { IAutoMovieSequenceRenderPlan } from "./IAutoMovieSequenceRenderPlan.js";

/**
 * The outcome of rendering a sequence through injected host I/O.
 *
 * @evidence contracts/development/design.md#principled-representation The result records captured samples in encode order alongside the executed manifest, schedule and actual encoded path.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeping the exact plan with captured frames lets inspection compare intended sequence samples with host-returned artifacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Frame paths are capture results and the output is the encoder result; neither is guessed from a fixture or inferred pattern.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish global sample seconds, capture-order records, input pattern, directory and exact encoder arguments.
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
