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
