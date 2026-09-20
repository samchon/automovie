import { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";
import { IAutoMoviePlaybackSample } from "./IAutoMoviePlaybackSample";
import { resolveFromTimeline } from "./resolveFromTimeline";
import { sequenceTimeline } from "./sequenceTimeline";

/**
 * Resolve one output second to what is on screen: the last entry whose span
 * contains the instant is live; while the instant still sits inside that
 * entry's incoming transition, the previous entry's tail rides along as the
 * `blend` with the incoming weight `alpha = elapsed / transition`. Returns null
 * outside `[0, runtime)`, there is no frame there to draw. Builds the timeline
 * per call, for random single-instant access (interactive scrubbing); a whole
 * film drives {@link playbackCursor} off one timeline instead.
 *
 * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-time-ranges Treats the output interval as start-inclusive and end-exclusive by returning no frame before zero or at and beyond the computed runtime.
 * @evidence requirements/editorial/transitions-and-overlaps.md#editorial-overlap-composition Returns the live incoming picture and its outgoing contribution only while the requested instant lies inside the declared overlap.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline Applies the playback timeline's half-open film range before resolving the active entry.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-transition-overlap Resolves a valid film instant to the incoming picture plus any active outgoing overlap instead of composing outside the timeline.
 */
export const resolveSequencePlayback = (
  sequence: IAutoMovieSequence,
  shots: IAutoMovieShot[],
  seconds: number,
): IAutoMoviePlaybackSample | null => {
  const timeline = sequenceTimeline(sequence, shots);
  if (seconds < 0 || seconds >= timeline.runtime) return null;
  return resolveFromTimeline(sequence, timeline, seconds);
};
