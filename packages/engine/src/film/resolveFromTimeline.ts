import {
  type IAutoMoviePlaybackEntry,
  type IAutoMoviePlaybackSample,
  type IAutoMoviePlaybackTimeline,
  IAutoMovieSequence,
} from "@automovie/interface";

import { playbackEntryAt } from "./playbackEntryAt";
import { playbackSampleAt } from "./playbackSampleAt";

/**
 * Resolve one output instant against an already-built {@link sequenceTimeline}:
 * the random-access resolver behind {@link resolveSequencePlayback}.
 *
 * The live entry is the last one whose start is at or before `seconds`, the
 * incoming shot winning inside a transition overlap and the later of two equal
 * starts winning a full-length dissolve; {@link playbackCursor} applies the same
 * rule while sweeping forward, so both return the same sample. Because a cut
 * timeline's starts never decrease and each entry ends at or after the next one
 * starts, that entry is also the last whose span contains the instant.
 *
 * Precondition: `seconds` lies within `[0, runtime)` and the timeline came from
 * a sequence that passed `cutSequence`. Outside that range the answer is the
 * first entry before `0` and the last entry from `runtime` on, which is not a
 * frame anyone draws, so {@link resolveSequencePlayback} range-checks first.
 *
 * @param sequence The cut the timeline was built from.
 * @param timeline The cut laid onto the output clock.
 * @param seconds Output-clock seconds.
 * @returns The live shot and its local time, with the outgoing blend or `null`.
 */
export function resolveFromTimeline(
  sequence: IAutoMovieSequence,
  timeline: IAutoMoviePlaybackTimeline,
  seconds: number,
): IAutoMoviePlaybackSample {
  const entries: readonly IAutoMoviePlaybackEntry[] = timeline.entries;
  return playbackSampleAt(
    sequence,
    entries,
    playbackEntryAt(entries, seconds),
    seconds,
  );
}
