import { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";

import { IAutoMoviePlaybackTimeline } from "./IAutoMoviePlaybackTimeline";
import { preparePlaybackTimeline } from "./preparePlaybackTimeline";

/**
 * Lay the cut onto the output clock, the playback mirror of `cutSequence`'s runtime arithmetic: each entry plays its trimmed span, or the whole shot without a trim, and a transition pulls its entry forward to overlap the previous entry's tail by the transition's duration.
 *
 * Precondition: the sequence passed `cutSequence`, so every trim fits its shot and every transition fits inside the previous entry's played span. The structural faults this layout cannot proceed past still throw, naming the offending position: an empty sequence, a transition on the first entry, a sequence entry whose shot is not supplied, and two supplied shots sharing an id.
 *
 * @param sequence The cut, already accepted by `cutSequence`.
 * @param shots Every shot the cut references; extra shots are allowed.
 * @returns One placement per sequence entry and the total runtime in seconds.
 *
 * @evidence contracts/common.md#principled-implementation A running cursor accumulates each entry's played span and subtracts its incoming transition, the OpenTimelineIO model of transitions as overlaps, so `runtime` equals the played spans summed minus every transition duration, the value `cutSequence` reports.
 * @evidence contracts/common.md#clear-and-simple-design Exposes the timeline prepared by preparePlaybackTimeline; frame consumers receive only entries and runtime while the event consumer also uses that preparation's shot index, so overlap arithmetic and duplicate admission have one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shot or entry is special-cased; a first-entry transition and a duplicate shot id throw instead of being dropped or resolved by position.
 * @evidence contracts/common.md#meaningful-documentation States the layout rule, the precondition and what it guarantees, every throw, that extra shots are allowed, and the unit of the runtime.
 * @evidence contracts/performance.md#efficient-algorithms One pass to index the S supplied shots and one pass over the E sequence entries, O(S + E) time and O(S + E) space; the index is required to resolve each entry's shot in constant time and to refuse duplicate ids.
 * @evidence contracts/performance.md#reuse-equivalent-work Delegates the index and layout to preparePlaybackTimeline, also consumed by sequenceEventTimeline without rebuilding the shot index; frame callers reuse the returned timeline across queries, with no cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The shot index is released on return; the result owns one entry record per sequence entry, which lives as long as the caller keeps the timeline.
 */
export function sequenceTimeline(
  sequence: IAutoMovieSequence,
  shots: IAutoMovieShot[],
): IAutoMoviePlaybackTimeline {
  return preparePlaybackTimeline(sequence, shots).timeline;
}
