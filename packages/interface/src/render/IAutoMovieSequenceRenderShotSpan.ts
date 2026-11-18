import type { IAutoMovieTrim } from "../cinematics/IAutoMovieTrim.js";

/**
 * A shot entry resolved onto the sequence output clock.
 *
 * @evidence contracts/development/design.md#principled-representation An entry index joins a committed shot to its global start and end, output duration, source offset and effective nondefault rate, preserving the authored trim.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The manifest exposes shot timing in one span record so capture hosts need not recompute sequence trim arithmetic.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The span records engine-resolved timing and authored trim without supplying a replacement shot or consumer-specific duration.
 * @evidence contracts/development/common.md#meaningful-documentation Member documentation distinguishes global seconds, source-local seconds, entry indexing, nullable authored trim and the default playback rate.
 */
export interface IAutoMovieSequenceRenderShotSpan {
  /**
   * Index into `sequence.shots`.
   */
  entry: number;

  /**
   * Shot id played by this entry.
   */
  shot: string;

  /**
   * Inclusive global output second where the entry starts.
   */
  start: number;

  /**
   * Exclusive global output second where the source excerpt ends; transition overlap may make another entry live earlier.
   */
  end: number;

  /**
   * Output seconds this entry occupies.
   */
  played: number;

  /**
   * Source shot-local second where playback begins.
   */
  offset: number;

  /**
   * Trim copied from the sequence entry.
   */
  trim: IAutoMovieTrim | null;

  /** Source seconds per output second. Absent at the default 1× rate. */
  playbackRate?: number;
}
