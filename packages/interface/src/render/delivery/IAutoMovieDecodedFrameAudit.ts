import type { IAutoMovieDecodedFrame } from "./IAutoMovieDecodedFrame.js";

/**
 * A decoded stream admitted against exact half-open frame intervals. auditAutoMovieDecodedFrames uses positive rational time-base ticks and BigInt cross products to establish frame i covers [i/fps, (i+1)/fps); repeatedImages lists later indices of adjacent equal MD5 values, without judging motion quality.
 *
 * @evidence contracts/development/design.md#principled-representation A decoded stream admitted against exact half-open frame intervals. auditAutoMovieDecodedFrames uses positive rational time-base ticks and BigInt cross products to establish frame i covers [i/fps, (i+1)/fps); repeatedImages lists later indices of adjacent equal MD5 values, without judging motion quality.
 * @evidence contracts/development/design.md#minimal-and-owned-surface auditAutoMovieDecodedFrames.IResult exchanges frameCount, durationSeconds, timeBase, frames, repeatedImages; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A decoded stream admitted against exact half-open frame intervals. auditAutoMovieDecodedFrames uses positive rational time-base ticks and BigInt cross products to establish frame i covers [i/fps, (i+1)/fps); repeatedImages lists later indices of adjacent equal MD5 values, without judging motion quality.
 * @evidence contracts/development/common.md#meaningful-documentation A decoded stream admitted against exact half-open frame intervals. auditAutoMovieDecodedFrames uses positive rational time-base ticks and BigInt cross products to establish frame i covers [i/fps, (i+1)/fps); repeatedImages lists later indices of adjacent equal MD5 values, without judging motion quality. The prose and members document how auditAutoMovieDecodedFrames.IResult interprets and admits these values.
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
