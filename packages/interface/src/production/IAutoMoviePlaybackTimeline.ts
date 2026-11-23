import type { IAutoMoviePlaybackEntry } from "./IAutoMoviePlaybackEntry";

/**
 * A sequence laid onto the output clock: every entry's placement and the total
 * runtime.
 *
 * `sequenceTimeline` builds it from a sequence that passed `cutSequence`.
 * `resolveFromTimeline` and `playbackCursor` resolve output instants against
 * it, and the render and caption plans build it once per film and reuse it for
 * every frame.
 */
export interface IAutoMoviePlaybackTimeline {
  /** One placement per sequence entry, in sequence order. */
  entries: IAutoMoviePlaybackEntry[];

  /**
   * Total output seconds: the last entry's end, which is the played spans
   * summed minus every transition overlap.
   */
  runtime: number;
}
