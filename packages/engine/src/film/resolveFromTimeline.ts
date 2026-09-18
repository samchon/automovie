import { IAutoMovieSequence } from "@automovie/interface";
import { IAutoMoviePlaybackEntry } from "./IAutoMoviePlaybackEntry";
import { IAutoMoviePlaybackSample } from "./IAutoMoviePlaybackSample";
import { IAutoMoviePlaybackTimeline } from "./IAutoMoviePlaybackTimeline";

/**
 * Turn one live entry into the on-screen sample: the live shot at its local
 * time, plus, inside the live entry's incoming transition, the previous entry's
 * tail as the `blend` with the incoming weight `alpha = elapsed / transition`.
 * The single place the shot/time/blend shape is built, so the stateless and
 * cursor resolvers cannot drift.
 */
const sampleAt = (
  sequence: IAutoMovieSequence,
  entries: readonly IAutoMoviePlaybackEntry[],
  live: IAutoMoviePlaybackEntry,
  seconds: number,
): IAutoMoviePlaybackSample => {
  const transition = sequence.shots[live.entry]!.transition;
  const elapsed = seconds - live.start;
  let blend: IAutoMoviePlaybackSample["blend"] = null;
  if (transition !== null && elapsed < transition.duration) {
    const outgoing = entries[live.entry - 1]!;
    blend = {
      shot: outgoing.shot,
      time: outgoing.offset + (seconds - outgoing.start),
      alpha: elapsed / transition.duration,
    };
  }
  return { shot: live.shot, time: live.offset + elapsed, blend };
};

/**
 * Resolve one instant against an already-built {@link sequenceTimeline}, the
 * single-source resolver behind {@link resolveSequencePlayback} and the render
 * plan. The last entry whose span contains the instant is live (the incoming
 * shot wins inside a transition overlap). Precondition: `seconds` lies within
 * `[0, runtime)`, the caller already framed a real output instant (the render
 * plan drives it from `frameTimes`; {@link resolveSequencePlayback} range-checks
 * first). O(entries); for a whole film use {@link playbackCursor}.
 *
 * @evidence requirements/editorial/transitions-and-overlaps.md#editorial-overlap-composition Resolves one output instant to the incoming entry and its optional outgoing overlap contribution.
 * @evidence requirements/editorial/transitions-and-overlaps.md#editorial-transition-timing Evaluates the incoming start, outgoing source time, and linear picture weight directly from the requested film instant and declared overlap duration.
 * @evidence requirements/editorial/transitions-and-overlaps.md#editorial-transition-boundary-samples Includes the outgoing picture with zero incoming weight at overlap start and removes the blend at the end-exclusive transition boundary.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-transition-overlap Selects the incoming picture at an overlap instant and derives the outgoing sample and normalized picture weight from the same film time.
 */
export const resolveFromTimeline = (
  sequence: IAutoMovieSequence,
  timeline: IAutoMoviePlaybackTimeline,
  seconds: number,
): IAutoMoviePlaybackSample => {
  let live = timeline.entries[0]!;
  for (const entry of timeline.entries)
    if (entry.start <= seconds && seconds < entry.start + entry.played)
      live = entry;
  return sampleAt(sequence, timeline.entries, live, seconds);
};
