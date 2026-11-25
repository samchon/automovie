import type { IAutoMovieSequenceRenderFrame } from "./IAutoMovieSequenceRenderFrame.js";
import type { IAutoMovieSequenceRenderPlan } from "./IAutoMovieSequenceRenderPlan.js";

/** The outcome of rendering a sequence through injected host I/O. */
export interface IAutoMovieSequenceRenderResult {
  /** Path to the encoded video. */
  output: string;

  /** Number of captured frames. */
  frameCount: number;

  /** Global output sample times. */
  times: number[];

  /** Captured frame samples in encode order. */
  frames: IAutoMovieSequenceRenderFrame[];

  /** Directory passed through the manifest for frame files. */
  frameDir: string;

  /** Ffmpeg input pattern for the captured frame sequence. */
  inputPattern: string;

  /** Exact ffmpeg argument vector handed to the encode adapter. */
  ffmpegArgs: string[];

  /** The deterministic sequence manifest that drove capture. */
  plan: IAutoMovieSequenceRenderPlan;
}
