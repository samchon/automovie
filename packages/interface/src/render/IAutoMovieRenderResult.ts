import type { IAutoMovieCapturedFrame } from "./IAutoMovieCapturedFrame.js";

/**
 * The outcome of a render: encoded video plus frame metadata an agent can
 * inspect without inferring paths from the ffmpeg pattern.
 */
export interface IAutoMovieRenderResult {
  /** Path to the encoded video (the adapter's `encode` output). */
  output: string;

  /** Number of frames captured and encoded. */
  frameCount: number;

  /** The clip-local sample instants, one per frame (`t = i / fps`). */
  times: number[];

  /** Captured frame artifacts in encode order. */
  frames: IAutoMovieCapturedFrame[];

  /** Directory passed to each `captureFrame` call. */
  frameDir: string;

  /** Ffmpeg input pattern used to encode the frame sequence. */
  inputPattern: string;

  /** Exact ffmpeg argument vector handed to the encode adapter. */
  ffmpegArgs: string[];
}
