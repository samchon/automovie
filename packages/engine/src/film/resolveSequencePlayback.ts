import { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";

import { IAutoMoviePlaybackSample } from "./IAutoMoviePlaybackSample";
import { IAutoMoviePlaybackTimeline } from "./IAutoMoviePlaybackTimeline";
import { resolveFromTimeline } from "./resolveFromTimeline";
import { sequenceTimeline } from "./sequenceTimeline";

/**
 * What is on screen at one output second: the live entry's shot at its local
 * time and, inside that entry's incoming transition, the previous entry's tail
 * as the `blend` with incoming weight `alpha = elapsed / transition`.
 *
 * Returns `null` for an instant outside `[0, runtime)`, `NaN` included, where
 * there is no frame to draw. It builds the timeline on every call, which suits
 * random single-instant access such as interactive scrubbing; a whole film
 * builds one timeline and drives {@link playbackCursor} or
 * {@link resolveFromTimeline} from it instead.
 * Throws what {@link sequenceTimeline} throws for an empty sequence, a
 * first-entry transition, a missing shot or a duplicated shot id.
 *
 * @param sequence The cut, already accepted by `cutSequence`.
 * @param shots Every shot the cut references.
 * @param seconds Output-clock seconds.
 * @returns The on-screen sample, or `null` outside the runtime.
 *
 * @evidence contracts/common.md#principled-implementation Builds the output-clock layout with `sequenceTimeline`, rejects instants outside the half-open runtime, and resolves the rest with `resolveFromTimeline`, so the precondition that resolver states is checked here rather than assumed.
 * @evidence contracts/common.md#clear-and-simple-design A convenience entry that composes the two timeline steps for a caller holding only the sequence and shots; the layout and live-entry rules stay in their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No instant or shot is special-cased; the `null` for an out-of-range instant is the stated contract, not a fallback for a failure.
 * @evidence contracts/common.md#meaningful-documentation States what the sample holds, the `null` range, the per-call timeline build and which API a whole film should use instead, every inherited throw, and each parameter's role.
 * @evidence contracts/performance.md#efficient-algorithms O(S + E) per call to index S shots and lay out E entries, then O(log E) to find the live entry; the rebuild is the price of taking no prebuilt timeline, and the documentation directs repeated queries to the timeline-based resolvers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Deliberately keeps no timeline between calls: the sequence and shots are plain values with no identity to key a cache on, and a caller that queries repeatedly is pointed at `resolveFromTimeline` with a timeline it owns.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The timeline built per call is released on return; only the returned sample survives, owned by the caller.
 */
export function resolveSequencePlayback (
  sequence: IAutoMovieSequence,
  shots: IAutoMovieShot[],
  seconds: number,
): IAutoMoviePlaybackSample | null {
  const timeline: IAutoMoviePlaybackTimeline = sequenceTimeline(
    sequence,
    shots,
  );
  if (!(seconds >= 0 && seconds < timeline.runtime)) return null;
  return resolveFromTimeline(sequence, timeline, seconds);
}
