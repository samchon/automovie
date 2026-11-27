import {
  type IAutoMoviePlaybackSample,
  type IAutoMoviePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";

import { resolveFromTimeline } from "./resolveFromTimeline";
import { sequenceTimeline } from "./sequenceTimeline";

/*
 * What is on screen at one output second: the live entry's shot at its local
 * time and, inside that entry's incoming transition, the previous entry's tail
 * as the `blend` with incoming weight `alpha = elapsed / transition`.
 *
 * Returns `null` for an instant outside `[0, runtime)`, `NaN` included, where
 * there is no frame to draw. It builds the timeline on every call, which suits
 * random single-instant access such as interactive scrubbing; a whole film
 * builds one timeline and drives playbackCursor or
 * resolveFromTimeline from it instead. Throws what
 * sequenceTimeline throws for an empty sequence, a first-entry
 * transition, a missing shot or a duplicated shot id.
 * Parameter sequence: The cut, already accepted by `cutSequence`.
 * Parameter shots: Every shot the cut references.
 * Parameter seconds: Output-clock seconds.
 * Returns: The on-screen sample, or `null` outside the runtime.
 */
export function resolveSequencePlayback(
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
