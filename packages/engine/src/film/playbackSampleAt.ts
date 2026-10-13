import {
  IAutoMovieSequence,
  IAutoMovieTransition,
} from "@automovie/interface";

import { IAutoMoviePlaybackEntry } from "./IAutoMoviePlaybackEntry";
import { IAutoMoviePlaybackSample } from "./IAutoMoviePlaybackSample";

/**
 * Turn one live timeline entry into the on-screen sample at an output instant.
 *
 * The sample is the live shot at `offset + (seconds - start)`. Inside the live
 * entry's incoming transition, that is while `seconds - start` is less than
 * the transition's duration, it also carries the previous entry's tail as
 * `blend`, at that entry's own local time, with the incoming weight
 * `alpha = (seconds - start) / duration`. The caller picks the live entry;
 * a transition on the first entry is refused by `sequenceTimeline`, so the
 * previous entry always exists when a blend is built.
 *
 * @param sequence The sequence the timeline was built from.
 * @param entries The timeline's entries, in sequence order.
 * @param live The entry live at `seconds`.
 * @param seconds Output-clock seconds.
 * @returns A new sample.
 *
 * @evidence contracts/common.md#principled-implementation Shot-local time is the output time shifted by the entry's start and trim offset, and the dissolve weight is the linear ramp of elapsed time over the transition duration, both affine in `seconds`; it relies on `sequenceTimeline` placing every entry and refusing a first-entry transition.
 * @evidence contracts/common.md#clear-and-simple-design The one constructor behind the stateless `resolveFromTimeline` and the forward `playbackCursor`, which each carried a private copy, so random access and a sweep return identical samples for the same instant.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every entry and transition is sampled by the same two formulas; no shot or transition kind is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the live time formula, when a blend exists, the blend's time and weight, who chooses the live entry, why the previous entry exists, and the clock of each argument.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: two array reads and a few subtractions per sample.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure constructor of one sample that coordinates no work; locating the live entry, the costly part, is the caller's.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned sample.
 */
export function playbackSampleAt (
  sequence: IAutoMovieSequence,
  entries: readonly IAutoMoviePlaybackEntry[],
  live: IAutoMoviePlaybackEntry,
  seconds: number,
): IAutoMoviePlaybackSample {
  const transition: IAutoMovieTransition | null =
    sequence.shots[live.entry]!.transition;
  const elapsed: number = seconds - live.start;
  let blend: IAutoMoviePlaybackSample["blend"] = null;
  if (transition !== null && elapsed < transition.duration) {
    const outgoing: IAutoMoviePlaybackEntry = entries[live.entry - 1]!;
    blend = {
      shot: outgoing.shot,
      time: outgoing.offset + (seconds - outgoing.start),
      alpha: elapsed / transition.duration,
    };
  }
  return { shot: live.shot, time: live.offset + elapsed, blend };
}
