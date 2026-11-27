import {
  type IAutoMoviePlaybackEntry,
  type IAutoMoviePlaybackSample,
  type IAutoMoviePlaybackTimeline,
  IAutoMovieSequence,
} from "@automovie/interface";

import { playbackSampleAt } from "./playbackSampleAt";

/*
 * A forward-only playback resolver for a non-decreasing query clock, turning
 * repeated random-access searches into one sweep over frames and entries.
 *
 * Entry starts never decrease for a sequence that passed `cutSequence`; a
 * transition as long as the previous entry's played span makes two adjacent
 * starts equal, and the timeline tiles `[0, runtime)` with no gaps. The cursor
 * advances while the next entry's `start <= seconds`, so among equal starts it
 * lands on the highest index, the last entry whose span contains the instant,
 * which is the same live entry resolveFromTimeline's binary search
 * picks; both build the sample with playbackSampleAt, so the samples are
 * identical.
 *
 * The returned function keeps the live index between calls. Passing a time
 * earlier than the previous call does not move the cursor back and returns a
 * wrong sample; use resolveFromTimeline for random access.
 * `playbackFrameSamples` drives it once per output frame in order.
 * Parameter sequence: The sequence the timeline was built from.
 * Parameter timeline: The timeline of `sequence`, from `sequenceTimeline`.
 * Returns: A resolver from output seconds to the on-screen sample.
 */
export function playbackCursor(
  sequence: IAutoMovieSequence,
  timeline: IAutoMoviePlaybackTimeline,
): (seconds: number) => IAutoMoviePlaybackSample {
  const entries: readonly IAutoMoviePlaybackEntry[] = timeline.entries;
  let live: number = 0;
  return (seconds: number): IAutoMoviePlaybackSample => {
    while (live + 1 < entries.length && entries[live + 1]!.start <= seconds)
      ++live;
    return playbackSampleAt(sequence, entries, entries[live]!, seconds);
  };
}
