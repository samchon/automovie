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
 * A forward-only playback resolver for a **monotonically non-decreasing** query
 * clock, the whole-film seam that turns the per-frame O(entries) scan into one
 * O(frames + entries) sweep (the render/caption plans call it once per frame in
 * output order). Entry starts are **non-decreasing**, a full-overlap dissolve
 * (`transition.duration === previousPlayed`) makes two adjacent starts equal,
 * which `cutSequence` allows, and the timeline tiles `[0, runtime)` with no
 * gaps. The advance test is `start <= seconds`, so among equal-start entries
 * the cursor lands on the **highest** index, which is exactly the last entry
 * whose span contains the instant, the same live entry
 * {@link resolveFromTimeline}'s scan returns, so the samples are byte-identical.
 * (Strict increase is NOT required and is not enforced; the earlier "strictly
 * increasing" note was the one false premise in this argument.) Feeding it a
 * time earlier than the previous call breaks the non-decreasing-clock
 * invariant; use {@link resolveFromTimeline} for random access.
 *
 * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time Advances a forward-only cursor across non-decreasing output times while preserving the same entry selection as direct resolution.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline playbackCursor realizes rational global-timeline evaluation: A forward-only playback resolver for a **monotonically non-decreasing** query clock, the whole-film seam that turns the per-frame O(entries) scan into one O(frames + entries) sweep (the render/caption plans call it once per frame in output order). Entry starts are **non-decreasing**, a full-overlap dissolve (`transition.duration === previousPlayed`) makes two adjacent starts equal, which `cutSequence` allows, and the timeline tiles `[0, runtime)` with no gaps. The advance test is `start <= seconds`, so among equal-start entries the cursor lands on the **highest** index, which is exactly the last entry whose span contains the instant, the same live entry {@link resolveFromTimeline}'s scan returns, so the samples are byte-identical. (Strict increase is NOT required and is not enforced; the earlier "strictly increasing" note was the one false premise in this argument.) Feeding it a time earlier than the previous call breaks the non-decreasing-clock invariant; use {@link resolveFromTimeline} for random access.
 */
export const playbackCursor = (
  sequence: IAutoMovieSequence,
  timeline: IAutoMoviePlaybackTimeline,
): ((seconds: number) => IAutoMoviePlaybackSample) => {
  const entries = timeline.entries;
  let liveIdx = 0;
  return (seconds: number): IAutoMoviePlaybackSample => {
    while (
      liveIdx + 1 < entries.length &&
      entries[liveIdx + 1]!.start <= seconds
    )
      ++liveIdx;
    return sampleAt(sequence, entries, entries[liveIdx]!, seconds);
  };
};
