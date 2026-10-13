import {
  IAutoMovieInteractionEvent,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { IAutoMoviePlaybackEntry } from "./IAutoMoviePlaybackEntry";
import { IAutoMoviePlaybackEvent } from "./IAutoMoviePlaybackEvent";
import { IAutoMoviePlaybackTimeline } from "./IAutoMoviePlaybackTimeline";
import { sequenceTimeline } from "./sequenceTimeline";

/** Seconds within which two clock values count as the same instant. */
const TIME_EPSILON: number = 1e-9;

/**
 * Place every shot interaction event onto the sequence output clock, once per
 * play.
 *
 * An entry emits the events inside its trimmed source range `[from, to)`, each
 * at `start + (time - offset)`; events outside every trim are omitted. The
 * range is half-open so an event exactly on a contiguous trim seam is emitted
 * once, by the entry that starts there. It closes at `to` in two cases: when
 * the trim ends at the shot's own end, so a shot-final event is never lost,
 * and when no other entry of the same shot both starts at that shot-local
 * instant and starts at this entry's global end, so cutting away exactly on a
 * hit keeps the hit. A replay of the same source span elsewhere on the output
 * clock, such as a flashback, does not take the seam event from the cut,
 * because only a globally contiguous entry shows the same on-screen instant.
 *
 * Each entry that shows an instant emits that instant's events at its own
 * global time, so an event replayed by a flashback lands once per play. The
 * events are ordered by global time, then entry index, then event id by UTF-16
 * code units. Each keeps its shot-local `time` and adds `shotTime`, `entry`,
 * `shot` and `globalTime`. Throws what {@link sequenceTimeline} throws.
 *
 * @param sequence The cut, already accepted by `cutSequence`.
 * @param shots Every shot the cut references.
 * @returns Every emitted play of every event, in output order.
 *
 * @evidence contracts/common.md#principled-implementation Maps each event through the entry's affine clock map and decides membership with half-open trim ranges, the interval convention under which contiguous ranges partition time without double counting; seam ownership requires both a shot-local and a global coincidence because only a contiguous entry shows the same frame, and all comparisons use one `1e-9` second tolerance for the floating sums the timeline produces.
 * @evidence contracts/common.md#clear-and-simple-design Reads the layout from `sequenceTimeline` instead of recomputing it, so events and frames share one clock; the only extra structure is the per-shot entry list the seam rule needs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No event kind, shot or entry is special-cased; the shot-end and seam rules apply to every entry by the same tests, and ties sort by code units rather than locale.
 * @evidence contracts/common.md#meaningful-documentation States the range rule and both closing cases with their reasons, the per-play semantics, the order and its tie-breaks, the added fields, and the inherited throws.
 * @evidence contracts/performance.md#efficient-algorithms O(S + E) to lay out and index, O(sum of events per played entry) to place, plus an O(Es) scan of the same shot's entries only for an event exactly on a trim end, and O(V log V) to sort the V emitted events; the sort is needed because entries overlap in transitions.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Builds the timeline it needs per call; its callers derive the event list once per film, and the sequence and shots carry no identity to key a cache on.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The timeline, shot index and per-shot entry lists are released on return; the result holds one fresh record per emitted play, which grows with plays times events and lives as long as the caller keeps it.
 */
export const sequenceEventTimeline = (
  sequence: IAutoMovieSequence,
  shots: IAutoMovieShot[],
): IAutoMoviePlaybackEvent[] => {
  // The timeline has already refused duplicate shot ids and missing shots, so
  // this index is unambiguous and every entry's shot is in it.
  const timeline: IAutoMoviePlaybackTimeline = sequenceTimeline(
    sequence,
    shots,
  );
  const shotById: Map<string, IAutoMovieShot> = new Map(
    shots.map((shot: IAutoMovieShot): [string, IAutoMovieShot] => [
      shot.id,
      shot,
    ]),
  );
  const entriesByShot: Map<string, IAutoMoviePlaybackEntry[]> = new Map();
  for (const entry of timeline.entries) {
    const list: IAutoMoviePlaybackEntry[] = entriesByShot.get(entry.shot) ?? [];
    list.push(entry);
    entriesByShot.set(entry.shot, list);
  }

  const events: IAutoMoviePlaybackEvent[] = [];
  for (const entry of timeline.entries) {
    const shot: IAutoMovieShot = shotById.get(entry.shot)!;
    const from: number = entry.offset;
    const to: number = entry.offset + entry.played;
    const globalEnd: number = entry.start + entry.played;
    const atShotEnd: boolean = Math.abs(to - shot.duration) <= TIME_EPSILON;
    // An event exactly on this entry's trim end belongs to the entry that
    // starts there only when that entry also starts at this entry's global
    // end, sharing the on-screen instant; otherwise this entry keeps it.
    const ownedElsewhere = (time: number): boolean =>
      entriesByShot
        .get(entry.shot)!
        .some(
          (other: IAutoMoviePlaybackEntry): boolean =>
            Math.abs(other.offset - time) <= TIME_EPSILON &&
            Math.abs(other.start - globalEnd) <= TIME_EPSILON,
        );
    for (const event of shot.events ?? []) {
      if (event.time < from - TIME_EPSILON) continue;
      if (
        atShotEnd
          ? event.time > to + TIME_EPSILON
          : Math.abs(event.time - to) <= TIME_EPSILON
            ? ownedElsewhere(event.time)
            : event.time >= to - TIME_EPSILON
      )
        continue;
      events.push(placed(event, entry));
    }
  }
  return events.sort(
    (a: IAutoMoviePlaybackEvent, b: IAutoMoviePlaybackEvent): number =>
      a.globalTime - b.globalTime ||
      a.entry - b.entry ||
      compareCodeUnits(a.id, b.id),
  );
};

/** One play of `event` by `entry`, stamped with its output time. */
const placed = (
  event: IAutoMovieInteractionEvent,
  entry: IAutoMoviePlaybackEntry,
): IAutoMoviePlaybackEvent => ({
  ...event,
  entry: entry.entry,
  shot: entry.shot,
  shotTime: event.time,
  globalTime: entry.start + (event.time - entry.offset),
});
