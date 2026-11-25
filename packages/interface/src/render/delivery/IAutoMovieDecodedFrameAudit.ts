import type { IAutoMovieDecodedFrame } from "./IAutoMovieDecodedFrame.js";

/**
 * A decoded stream admitted against exact half-open frame intervals.
 * auditAutoMovieDecodedFrames uses positive rational time-base ticks and BigInt
 * cross products to establish frame i covers [i/fps, (i+1)/fps); repeatedImages
 * lists later indices of adjacent equal MD5 values, without judging motion
 * quality.
 */
export interface IAutoMovieDecodedFrameAudit {
  /** Decoded images. */
  frameCount: number;

  /** Commissioned duration, seconds. */
  durationSeconds: number;

  /** Decoder time base. */
  timeBase: readonly [number, number];

  /** Every frame in output order. */
  frames: IAutoMovieDecodedFrame[];

  /** Indices of frames identical to their predecessor. */
  repeatedImages: number[];
}
