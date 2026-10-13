import { IAutoMoviePlaybackEntry } from "./IAutoMoviePlaybackEntry";

/**
 * A sequence laid onto the output clock: every entry's placement and the total
 * runtime.
 *
 * `sequenceTimeline` builds it from a sequence that passed `cutSequence`.
 * `resolveFromTimeline` and `playbackCursor` resolve output instants against
 * it, and the render and caption plans build it once per film and reuse it for
 * every frame.
 *
 * @evidence contracts/common.md#principled-implementation `runtime` is the end of the last entry, `start + played`, which equals the sum of played spans minus the sum of transition durations that `cutSequence` reports, and the entries tile `[0, runtime)` without gaps because each start is the previous end pulled back only by an overlap.
 * @evidence contracts/common.md#clear-and-simple-design Holds the placements and the one derived total, so a random-access resolver, a forward cursor and the plans all read one precomputed layout instead of repeating the overlap arithmetic per instant.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The timeline carries no per-consumer field; the render plan, caption plan and frame sampler read the same entries and runtime.
 * @evidence contracts/common.md#meaningful-documentation States the producer and its precondition, the consumers and how they reuse it, the entry order, and how runtime is computed and in which unit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; it is built in one pass over the sequence by `sequenceTimeline`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The reuse lives in its callers, which build one timeline per film and resolve every frame against it; the record itself caches nothing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns one entry per sequence entry, held by value and released with the caller's timeline.
 * @author Samchon
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
