import {
  IAutoMovieInteractionEvent,
  type IAutoMoviePlaybackEntry,
  type IAutoMoviePlaybackEvent,
  type IAutoMoviePreparePlaybackTimeline,
  IAutoMovieSequence,
  type IAutoMovieSequenceEntry,
  IAutoMovieShot,
} from "@automovie/interface";

import { AutoMovieEngineText } from "../text/AutoMovieEngineText";
import { exactPlaybackHardCut } from "./exactPlaybackHardCut";
import { preparePlaybackTimeline } from "./preparePlaybackTimeline";

/** Original clock tolerance for ordinary numeric plays away from exact seams. */
const TIME_EPSILON: number = 1e-9;

/**
 * Place every shot interaction event onto the sequence output clock, once per
 * play.
 *
 * An entry emits the events inside its trimmed source range `[from, to)`, each
 * at `start + (time - offset) / rate`; events outside every trim are omitted.
 * The source end uses the exact symbolic trim boundary when present. An event
 * at that boundary uses the played output end. The range is half-open so an
 * event exactly on a contiguous trim seam is emitted once, by the entry that
 * starts there. It closes at `to` in two cases: when the trim ends at the
 * shot's own end, so a shot-final event is never lost, and when no other entry
 * of the same shot both starts at that shot-local instant and starts at this
 * entry's global end, so cutting away exactly on a hit keeps the hit. A replay
 * of the same source span elsewhere on the output clock, such as a flashback,
 * does not take the seam event from the cut, because only a globally contiguous
 * entry shows the same on-screen instant.
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
 *   Symbolic trims and retimed plays use exact event membership. On an adjacent
 *   same-shot hard cut involving either, both plays use exact adjoining edges.
 *   When the edges meet, the incoming source start owns the seam. Numeric
 *   duration reconstruction can disagree with that start by binary64 roundoff.
 *   Outside a shared seam the numeric source end is the binary64 sum of the
 *   start and duration. Select an end event explicitly to keep an independently
 *   authored time. If the numeric sum rounds back to the start, an event at
 *   that instant is still an opening event. Other numeric edges retain the
 *   existing tolerance.
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
    const exact: boolean = precise(entry);
    const previous: IAutoMoviePlaybackEntry | undefined =
      timeline.entries[entry.entry - 1];
    const next: IAutoMoviePlaybackEntry | undefined =
      timeline.entries[entry.entry + 1];
    const exactCutIn: boolean =
      previous !== undefined && preciseHardCut(previous, entry);
    const preciseNext: IAutoMoviePlaybackEntry | undefined =
      next !== undefined && preciseHardCut(entry, next) ? next : undefined;
    const sourceEndpoint: number = sourceEnd(entry, shot.duration);
    const outgoingSeam: number | undefined =
      preciseNext === undefined
        ? undefined
        : exactPlaybackHardCut(sequence, entry, preciseNext, sourceEndpoint);
    const to: number = outgoingSeam ?? sourceEndpoint;
    const fromEpsilon: number = exact || exactCutIn ? 0 : TIME_EPSILON;
    const exactEnd: boolean = exact || preciseNext !== undefined;
    const toEpsilon: number = exactEnd ? 0 : TIME_EPSILON;
    const globalEnd: number = entry.start + entry.played;
    const atShotEnd: boolean =
      outgoingSeam === undefined && Math.abs(to - shot.duration) <= toEpsilon;
    // An event exactly on this entry's trim end belongs to the entry that
    // starts there only when that entry also starts at this entry's global
    // end, sharing the on-screen instant; otherwise this entry keeps it.
    function ownedElsewhere(time: number): boolean {
      return entriesByShot
        .get(entry.shot)!
        .some((other: IAutoMoviePlaybackEntry): boolean => {
          if (other.entry === entry.entry) return false;
          return exactEnd || precise(other)
            ? other.offset === time && other.start === globalEnd
            : Math.abs(other.offset - time) <= toEpsilon &&
                Math.abs(other.start - globalEnd) <= TIME_EPSILON;
        });
    }
    for (const event of shot.events ?? []) {
      if (event.time < from - fromEpsilon) continue;
      if (exactEnd && event.time === from) {
        events.push(placed(event, entry, entry.start));
        continue;
      }
      if (
        atShotEnd
          ? event.time > to + toEpsilon
          : Math.abs(event.time - to) <= toEpsilon
            ? outgoingSeam !== undefined || ownedElsewhere(event.time)
            : event.time >= to - toEpsilon
      )
        continue;
      const globalTime: number =
        exactEnd && event.time === to
          ? globalEnd
          : entry.start + (event.time - from) / (entry.playbackRate ?? 1);
      events.push(
        placed(
          event,
          entry,
          exactEnd ? Math.min(globalTime, globalEnd) : globalTime,
        ),
      );
    }
  }
  return events.sort(
    (a: IAutoMoviePlaybackEvent, b: IAutoMoviePlaybackEvent): number =>
      a.globalTime - b.globalTime ||
      a.entry - b.entry ||
      AutoMovieEngineText.compareCodeUnits(a.id, b.id),
  );

  /** Rates and symbolic anchors introduced strict source membership. */
  function precise(entry: IAutoMoviePlaybackEntry): boolean {
    return (
      entry.playbackRate !== undefined ||
      sequence.shots[entry.entry]!.exactSourceEnd !== undefined
    );
  }

  /** A symbolic end or the end represented by the ordinary numeric span. */
  function sourceEnd(entry: IAutoMoviePlaybackEntry, duration: number): number {
    const source: IAutoMovieSequenceEntry = sequence.shots[entry.entry]!;
    return (
      source.exactSourceEnd ??
      entry.offset + (source.trim?.duration ?? duration)
    );
  }

  /** A precise play makes both adjoining edges of a same-shot hard cut exact. */
  function preciseHardCut(
    outgoing: IAutoMoviePlaybackEntry,
    incoming: IAutoMoviePlaybackEntry,
  ): boolean {
    return (
      outgoing.shot === incoming.shot &&
      sequence.shots[incoming.entry]!.transition === null &&
      (precise(outgoing) || precise(incoming))
    );
  }
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
