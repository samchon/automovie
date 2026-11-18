import {
  IAutoMovieInteractionEvent,
  type IAutoMoviePlaybackEntry,
  type IAutoMoviePlaybackEvent,
  type IAutoMoviePreparePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { preparePlaybackTimeline } from "./preparePlaybackTimeline";

/** Seconds within which two clock values count as the same instant. */
const TIME_EPSILON: number = 1e-9;

/**
 * Place every shot interaction event onto the sequence output clock, once per play.
 *
 * An entry emits the events inside its trimmed source range `[from, to)`, each at `start + (time - offset) / rate`; events outside every trim are omitted. The range is half-open so an event exactly on a contiguous trim seam is emitted once, by the entry that starts there. It closes at `to` in two cases: when the trim ends at the shot's own end, so a shot-final event is never lost, and when no other entry of the same shot both starts at that shot-local instant and starts at this entry's global end, so cutting away exactly on a hit keeps the hit. A replay of the same source span elsewhere on the output clock, such as a flashback, does not take the seam event from the cut, because only a globally contiguous entry shows the same on-screen instant.
 *
 * Each entry that shows an instant emits that instant's events at its own global time, so an event replayed by a flashback lands once per play. The events are ordered by global time, then entry index, then event id by UTF-16 code units. Each keeps its shot-local `time` and adds `shotTime`, `entry`, `shot` and `globalTime`. Throws what {@link sequenceTimeline} throws.
 *
 * @param sequence The cut, already accepted by `cutSequence`.
 * @param shots Every shot the cut references.
 * @returns Every emitted play of every event, in output order.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Maps each event through the entry's affine clock map and decides membership with half-open trim ranges, the interval convention under which contiguous ranges partition time without double counting; seam ownership requires both a shot-local and a global coincidence because only a contiguous entry shows the same frame, and compares clock boundaries with a tolerance of at most `1e-9` seconds. Retimed source comparisons further limit tolerance by the source span and by how far the difference would project on the output clock.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads layout and the admitted shot index from preparePlaybackTimeline, the preparation sequenceTimeline also uses, so events and frames share one clock; the only additional index is the per-shot entry list the seam rule needs.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No event kind, shot or entry is special-cased; the shot-end and seam rules apply to every entry by the same tests, and ties sort by code units rather than locale.
 * @evidence contracts/development/common.md#meaningful-documentation States the range rule and both closing cases with their reasons, the per-play semantics, the order and its tie-breaks, the added fields, and the inherited throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(S + E) to lay out and index, O(sum of events per played entry) to place, plus an O(Es) scan of the same shot's entries only for an event exactly on a trim end, and O(V log V) to sort the V emitted events; the sort is needed because entries overlap in transitions.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses preparePlaybackTimeline's shot index for every event lookup instead of indexing supplied shots twice; the layout and index refer to the same synchronous inputs. Callers derive events once per film; no cross-call cache exists.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The timeline, shot index and per-shot entry lists are released on return; the result holds one fresh record per emitted play, which grows with plays times events and lives as long as the caller keeps it.
 */
export function sequenceEventTimeline(
  sequence: IAutoMovieSequence,
  shots: IAutoMovieShot[],
): IAutoMoviePlaybackEvent[] {
  const { timeline, shotById }: IAutoMoviePreparePlaybackTimeline.IResult =
    preparePlaybackTimeline(sequence, shots);
  const entriesByShot: Map<string, IAutoMoviePlaybackEntry[]> = new Map();
  for (const entry of timeline.entries) {
    const list: IAutoMoviePlaybackEntry[] = entriesByShot.get(entry.shot) ?? [];
    list.push(entry);
    entriesByShot.set(entry.shot, list);
  }

  const events: IAutoMoviePlaybackEvent[] = [];
  for (const entry of timeline.entries) {
    const shot: IAutoMovieShot = shotById.get(entry.shot)!.shot;
    const from: number = entry.offset;
    const duration: number =
      sequence.shots[entry.entry]!.trim?.duration ?? shot.duration;
    const to: number = from + duration;
    const sourceEpsilon: number =
      entry.playbackRate === undefined
        ? TIME_EPSILON
        : Math.min(
            TIME_EPSILON,
            duration / 4,
            TIME_EPSILON * entry.playbackRate,
          );
    const globalEnd: number = entry.start + entry.played;
    const atShotEnd: boolean = Math.abs(to - shot.duration) <= sourceEpsilon;
    // An event exactly on this entry's trim end belongs to the entry that
    // starts there only when that entry also starts at this entry's global
    // end, sharing the on-screen instant; otherwise this entry keeps it.
    function ownedElsewhere(time: number): boolean {
      return entriesByShot
        .get(entry.shot)!
        .some(
          (other: IAutoMoviePlaybackEntry): boolean =>
            other.entry !== entry.entry &&
            Math.abs(other.offset - time) <= sourceEpsilon &&
            Math.abs(other.start - globalEnd) <= TIME_EPSILON,
        );
    }
    for (const event of shot.events ?? []) {
      if (event.time < from - sourceEpsilon) continue;
      if (
        atShotEnd
          ? event.time > to + sourceEpsilon
          : Math.abs(event.time - to) <= sourceEpsilon
            ? ownedElsewhere(event.time)
            : event.time >= to - sourceEpsilon
      )
        continue;
      const globalTime: number =
        entry.playbackRate !== undefined && event.time === to
          ? globalEnd
          : entry.start + (event.time - from) / (entry.playbackRate ?? 1);
      events.push(placed(event, entry, globalTime));
    }
  }
  return events.sort(
    (a: IAutoMoviePlaybackEvent, b: IAutoMoviePlaybackEvent): number =>
      a.globalTime - b.globalTime ||
      a.entry - b.entry ||
      compareCodeUnits(a.id, b.id),
  );
}

/** One play of `event` by `entry`, stamped with its projected `globalTime`. */
function placed(
  event: IAutoMovieInteractionEvent,
  entry: IAutoMoviePlaybackEntry,
  globalTime: number,
): IAutoMoviePlaybackEvent {
  return {
    ...event,
    entry: entry.entry,
    shot: entry.shot,
    shotTime: event.time,
    globalTime,
  };
}
