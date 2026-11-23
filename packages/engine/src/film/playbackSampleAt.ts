import {
  type IAutoMoviePlaybackEntry,
  type IAutoMoviePlaybackSample,
  IAutoMovieSequence,
  IAutoMovieTransition,
} from "@automovie/interface";

/**
 * Turn one live timeline entry into the on-screen sample at an output instant.
 *
 * The sample is the live shot at `offset + (seconds - start) * rate`, with an
 * omitted rate equal to 1. Inside the live entry's incoming transition, that is
 * while `seconds - start` is less than the transition's duration, it also
 * carries the previous entry's tail as `blend`, at that entry's own local time,
 * with the incoming weight `alpha = (seconds - start) / duration`. The caller
 * picks the live entry; a transition on the first entry is refused by
 * `sequenceTimeline`, so the previous entry always exists when a blend is
 * built.
 *
 * @param sequence The sequence the timeline was built from.
 * @param entries The timeline's entries, in sequence order.
 * @param live The entry live at `seconds`.
 * @param seconds Output-clock seconds.
 * @returns A new sample.
 */
export function playbackSampleAt(
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
      time:
        outgoing.offset +
        (seconds - outgoing.start) * (outgoing.playbackRate ?? 1),
      alpha: elapsed / transition.duration,
    };
  }
  return {
    shot: live.shot,
    time: live.offset + elapsed * (live.playbackRate ?? 1),
    blend,
  };
}
