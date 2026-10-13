import {
  IAutoMovieSequence,
  IAutoMovieSequenceEntry,
  IAutoMovieShot,
} from "@automovie/interface";

import { IAutoMoviePlaybackEntry } from "./IAutoMoviePlaybackEntry";
import { IAutoMoviePlaybackTimeline } from "./IAutoMoviePlaybackTimeline";

/**
 * Lay the cut onto the output clock, the playback mirror of `cutSequence`'s
 * runtime arithmetic: each entry plays its trimmed span, or the whole shot
 * without a trim, and a transition pulls its entry forward to overlap the
 * previous entry's tail by the transition's duration.
 *
 * Precondition: the sequence passed `cutSequence`, so every trim fits its shot
 * and every transition fits inside the previous entry's played span. The
 * structural faults this layout cannot proceed past still throw, naming the
 * offending position: an empty sequence, a transition on the first entry, a
 * sequence entry whose shot is not supplied, and two supplied shots sharing an
 * id.
 *
 * @param sequence The cut, already accepted by `cutSequence`.
 * @param shots Every shot the cut references; extra shots are allowed.
 * @returns One placement per sequence entry and the total runtime in seconds.
 *
 * @evidence contracts/common.md#principled-implementation A running cursor accumulates each entry's played span and subtracts its incoming transition, the OpenTimelineIO model of transitions as overlaps, so `runtime` equals the played spans summed minus every transition duration, the value `cutSequence` reports.
 * @evidence contracts/common.md#clear-and-simple-design The one layout every playback consumer reads, the random-access resolver, the forward cursor, the event timeline and the render and caption plans, so the overlap arithmetic exists once on the playback side.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shot or entry is special-cased; a first-entry transition and a duplicate shot id throw instead of being dropped or resolved by position.
 * @evidence contracts/common.md#meaningful-documentation States the layout rule, the precondition and what it guarantees, every throw, that extra shots are allowed, and the unit of the runtime.
 * @evidence contracts/performance.md#efficient-algorithms One pass to index the S supplied shots and one pass over the E sequence entries, O(S + E) time and O(S + E) space; the index is required to resolve each entry's shot in constant time and to refuse duplicate ids.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Builds one timeline per call; its callers build it once per film and reuse it for every frame, which is where the reuse lives.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The shot index is released on return; the result owns one entry record per sequence entry, which lives as long as the caller keeps the timeline.
 */
export const sequenceTimeline = (
  sequence: IAutoMovieSequence,
  shots: IAutoMovieShot[],
): IAutoMoviePlaybackTimeline => {
  if (sequence.shots.length === 0)
    throw new Error(`sequence "${sequence.id}" must contain at least one shot`);

  const byId: Map<string, { shot: IAutoMovieShot; index: number }> =
    new Map();
  shots.forEach((shot: IAutoMovieShot, index: number): void => {
    const existing: { shot: IAutoMovieShot; index: number } | undefined =
      byId.get(shot.id);
    if (existing !== undefined)
      throw new Error(
        `shot id "${shot.id}" is duplicated at shots[${index}].id; first declared at shots[${existing.index}].id`,
      );
    byId.set(shot.id, { shot, index });
  });

  const entries: IAutoMoviePlaybackEntry[] = [];
  let cursor: number = 0;
  sequence.shots.forEach((entry: IAutoMovieSequenceEntry, i: number): void => {
    if (i === 0 && entry.transition !== null)
      throw new Error(
        "sequence.shots[0].transition has nothing to transition from",
      );
    const found: { shot: IAutoMovieShot; index: number } | undefined =
      byId.get(entry.shot);
    if (found === undefined)
      throw new Error(
        `sequence shot "${entry.shot}" at sequence.shots[${i}].shot was not provided`,
      );
    const played: number = entry.trim?.duration ?? found.shot.duration;
    const start: number = cursor - (entry.transition?.duration ?? 0);
    entries.push({
      entry: i,
      shot: entry.shot,
      start,
      played,
      offset: entry.trim?.start ?? 0,
    });
    cursor = start + played;
  });
  return { entries, runtime: cursor };
};
