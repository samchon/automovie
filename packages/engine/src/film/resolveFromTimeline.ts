import { IAutoMovieSequence } from "@automovie/interface";

import { IAutoMoviePlaybackEntry } from "./IAutoMoviePlaybackEntry";
import { IAutoMoviePlaybackSample } from "./IAutoMoviePlaybackSample";
import { IAutoMoviePlaybackTimeline } from "./IAutoMoviePlaybackTimeline";
import { playbackSampleAt } from "./playbackSampleAt";

/**
 * Resolve one output instant against an already-built {@link sequenceTimeline}: the random-access resolver behind {@link resolveSequencePlayback}.
 *
 * The live entry is the last one whose start is at or before `seconds`, the incoming shot winning inside a transition overlap and the later of two equal starts winning a full-length dissolve; {@link playbackCursor} applies the same rule while sweeping forward, so both return the same sample. Because a cut timeline's starts never decrease and each entry ends at or after the next one starts, that entry is also the last whose span contains the instant.
 *
 * Precondition: `seconds` lies within `[0, runtime)` and the timeline came from a sequence that passed `cutSequence`. Outside that range the answer is the first entry before `0` and the last entry from `runtime` on, which is not a frame anyone draws, so {@link resolveSequencePlayback} range-checks first.
 *
 * @param sequence The cut the timeline was built from.
 * @param timeline The cut laid onto the output clock.
 * @param seconds Output-clock seconds.
 * @returns The live shot and its local time, with the outgoing blend or `null`.
 *
 * @evidence contracts/common.md#principled-implementation Binary search over entry starts, valid because a cut timeline's starts are non-decreasing; the last start at or before the instant identifies the live entry because each entry's end is at or after its successor's start, and searching with `<=` lands on the highest of equal starts, the same tie rule as the forward cursor.
 * @evidence contracts/common.md#clear-and-simple-design Chooses the live entry and hands the sample shape to the shared `playbackSampleAt`, so random access and the forward cursor differ only in how they find the entry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No entry, shot or position is special-cased; an out-of-range instant is the caller's precondition and is answered by the same search rather than a special branch.
 * @evidence contracts/common.md#meaningful-documentation States the live-entry rule and its ties, why it equals the containing entry, its agreement with the cursor, the precondition and the out-of-range answer, and each parameter's role.
 * @evidence contracts/performance.md#efficient-algorithms O(log E) for E timeline entries by binary search over the sorted starts, replacing a full scan per instant; a whole-film sweep should still use `playbackCursor`, which is O(frames + entries).
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Resolves one instant against a timeline the caller built once and passes in; the timeline reuse is the caller's, and this resolver keeps nothing between calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned sample is fresh and owned by the caller.
 */
export function resolveFromTimeline (
  sequence: IAutoMovieSequence,
  timeline: IAutoMoviePlaybackTimeline,
  seconds: number,
): IAutoMoviePlaybackSample {
  const entries: readonly IAutoMoviePlaybackEntry[] = timeline.entries;
  let low: number = 0;
  let high: number = entries.length - 1;
  while (low < high) {
    const middle: number = Math.ceil((low + high) / 2);
    if (entries[middle]!.start <= seconds) low = middle;
    else high = middle - 1;
  }
  return playbackSampleAt(sequence, entries, entries[low]!, seconds);
}
