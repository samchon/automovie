import { IAutoMovieTrim } from "@automovie/interface";

/**
 * A shot entry resolved onto the sequence output clock.
 *
 * @evidence contracts/common.md#principled-implementation An entry index joins a committed shot to its global start and end, played length and source offset in seconds, preserving the authored trim.
 * @evidence contracts/common.md#clear-and-simple-design The manifest exposes shot timing in one span record so capture hosts need not recompute sequence trim arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The span records engine-resolved timing and authored trim without supplying a replacement shot or consumer-specific duration.
 * @evidence contracts/common.md#meaningful-documentation Member documentation distinguishes global seconds, source-local seconds, entry indexing and nullable authored trim.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The resolved shot span schema declares data and chooses no runtime algorithm; its producer documents construction cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The one editorial entry's timing describes an identity boundary and performs no request coordination or result caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased shot-span shape acquires nothing; planSequenceRender creates the timing record, borrows its trim reference and transfers it through the caller-owned manifest.
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
