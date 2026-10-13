import { IAutoMovieSequence } from "@automovie/interface";

import { IAutoMoviePlaybackEntry } from "./IAutoMoviePlaybackEntry";
import { IAutoMoviePlaybackSample } from "./IAutoMoviePlaybackSample";
import { IAutoMoviePlaybackTimeline } from "./IAutoMoviePlaybackTimeline";
import { playbackSampleAt } from "./playbackSampleAt";

/**
 * A forward-only playback resolver for a non-decreasing query clock, turning
 * the per-frame scan over every entry into one sweep over frames and entries.
 *
 * Entry starts never decrease for a sequence that passed `cutSequence`; a
 * transition as long as the previous entry's played span makes two adjacent
 * starts equal, and the timeline tiles `[0, runtime)` with no gaps. The cursor
 * advances while the next entry's `start <= seconds`, so among equal starts it
 * lands on the highest index, the last entry whose span contains the instant,
 * which is the same live entry {@link resolveFromTimeline}'s scan picks; both
 * build the sample with {@link playbackSampleAt}, so the samples are identical.
 *
 * The returned function keeps the live index between calls. Passing a time
 * earlier than the previous call does not move the cursor back and returns a
 * wrong sample; use {@link resolveFromTimeline} for random access.
 * `playbackFrameSamples` drives it once per output frame in order.
 *
 * @param sequence The sequence the timeline was built from.
 * @param timeline The timeline of `sequence`, from `sequenceTimeline`.
 * @returns A resolver from output seconds to the on-screen sample.
 *
 * @evidence contracts/common.md#principled-implementation A monotone two-pointer sweep: the query clock and the entry starts are both non-decreasing, so the live entry index only ever advances, and the `start <= seconds` test picks the last containing entry exactly as the stateless scan does; the premise is a non-decreasing query clock, which the documentation states and every caller meets.
 * @evidence contracts/common.md#clear-and-simple-design The sweep owns only the live-entry search; the sample itself comes from the shared `playbackSampleAt`, so the cursor and the random-access resolver cannot drift.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No entry or transition is special-cased; a backward query is a documented misuse rather than something the cursor silently repairs.
 * @evidence contracts/common.md#meaningful-documentation States the ordering premises, the tie rule and why it matches random access, the retained state, the effect of a backward query and the alternative, and who drives it.
 * @evidence contracts/performance.md#efficient-algorithms Amortized constant time per query: across a whole film the index advances at most once per entry, so `n` frames over `m` entries cost `O(n + m)` instead of `O(n·m)`.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the live index found by the previous query as the start of the next search, which is valid because the query clock never decreases; the timeline itself is built once by the caller and shared by every query.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains the sequence, the entry list and one index for as long as the caller holds the resolver, a constant bound beyond the caller's own timeline, and releases them when the resolver is dropped.
 */
export const playbackCursor = (
  sequence: IAutoMovieSequence,
  timeline: IAutoMoviePlaybackTimeline,
): ((seconds: number) => IAutoMoviePlaybackSample) => {
  const entries: readonly IAutoMoviePlaybackEntry[] = timeline.entries;
  let live: number = 0;
  return (seconds: number): IAutoMoviePlaybackSample => {
    while (live + 1 < entries.length && entries[live + 1]!.start <= seconds)
      ++live;
    return playbackSampleAt(sequence, entries, entries[live]!, seconds);
  };
};
