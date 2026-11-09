import { IAutoMovieTrim } from "@automovie/interface";

/**
 * A shot entry resolved onto the sequence output clock.
 *
 * @evidence contracts/development/design.md#principled-representation An entry index joins a committed shot to its global start and end, played length and source offset in seconds, preserving the authored trim.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The manifest exposes shot timing in one span record so capture hosts need not recompute sequence trim arithmetic.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The span records engine-resolved timing and authored trim without supplying a replacement shot or consumer-specific duration.
 * @evidence contracts/development/common.md#meaningful-documentation Member documentation distinguishes global seconds, source-local seconds, entry indexing and nullable authored trim.
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
   * Global output second where the entry starts.
   */
  start: number;

  /**
   * Global output second where the entry ends.
   */
  end: number;

  /**
   * Seconds of the source shot that this entry plays.
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
}
