import {
  type IAutoMoviePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";

import { preparePlaybackTimeline } from "./preparePlaybackTimeline";

/*
 * Lay the cut onto the output clock, the playback mirror of `cutSequence`'s
 * runtime arithmetic: each entry occupies its retained source duration divided
 * by its playback rate, and a transition pulls its entry forward to overlap the
 * previous entry's tail by the transition's duration.
 *
 * Precondition: the sequence passed `cutSequence`, so every trim fits its shot
 * and every transition fits both adjacent output spans. The structural faults
 * this layout cannot proceed past still throw, naming the offending position:
 * an empty sequence, a transition on the first entry, a sequence entry whose
 * shot is not supplied, two supplied shots sharing an id, and a nondefault
 * playback rate that cannot produce a representable output span.
 * Parameter sequence: The cut, already accepted by `cutSequence`.
 * Parameter shots: Every shot the cut references; extra shots are allowed.
 * Returns: One placement per sequence entry and the total runtime in seconds.
 */
export function sequenceTimeline(
  sequence: IAutoMovieSequence,
  shots: IAutoMovieShot[],
): IAutoMoviePlaybackTimeline {
  return preparePlaybackTimeline(sequence, shots).timeline;
}
