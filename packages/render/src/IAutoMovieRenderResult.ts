import type { IAutoMovieCapturedFrame } from "./IAutoMovieCapturedFrame.js";

/**
 * The outcome of a render: encoded video plus frame metadata an agent can inspect without inferring paths from the ffmpeg pattern.
 *
 * @evidence contracts/development/design.md#principled-representation The encoded output path is accompanied by the half-open sample schedule and frame records, retaining encode order and the exact encoder argument vector.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One result envelope supplies both direct clip rendering and the inspectable render wrapper without another path inference layer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The result exposes host-returned output and frame paths; its type makes no claim that an encoder succeeded beyond the callback outcome.
 * @evidence contracts/development/common.md#meaningful-documentation Members explain seconds, frame ordering, directory, input pattern and the distinction between adapter output and requested paths.
 */
export interface IAutoMovieRenderResult {
  /**
   * Path to the encoded video (the adapter's `encode` output).
   */
  output: string;

  /**
   * Number of frames captured and encoded.
   */
  frameCount: number;

  /**
   * The clip-local sample instants, one per frame (`t = i / fps`).
   */
  times: number[];

  /**
   * Captured frame artifacts in encode order.
   */
  frames: IAutoMovieCapturedFrame[];

  /**
   * Directory passed to each `captureFrame` call.
   */
  frameDir: string;

  /**
   * Ffmpeg input pattern used to encode the frame sequence.
   */
  inputPattern: string;

  /**
   * Exact ffmpeg argument vector handed to the encode adapter.
   */
  ffmpegArgs: string[];
}
