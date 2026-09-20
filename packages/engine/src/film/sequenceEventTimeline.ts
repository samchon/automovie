import { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { IAutoMoviePlaybackEntry } from "./IAutoMoviePlaybackEntry";
import { IAutoMoviePlaybackEvent } from "./IAutoMoviePlaybackEvent";
import { sequenceTimeline } from "./sequenceTimeline";

const indexShots = (
  shots: readonly IAutoMovieShot[],
): Map<string, { shot: IAutoMovieShot; index: number }> => {
  const byId = new Map<string, { shot: IAutoMovieShot; index: number }>();
  shots.forEach((shot, index) => {
    const existing = byId.get(shot.id);
    if (existing !== undefined)
      throw new Error(
        `shot id "${shot.id}" is duplicated at shots[${index}].id; first declared at shots[${existing.index}].id`,
      );
    byId.set(shot.id, { shot, index });
  });
  return byId;
};

/**
 * Place every shot interaction event onto the sequence output clock. Events
 * outside a sequence entry's trimmed source range are omitted. The range is
 * half-open (`[from, to)`) so an event sitting exactly on a contiguous trim
 * seam is emitted once, by the entry that starts there, not once per
 * neighbouring entry (#1009); it closes at `to` when the trim ends at the
 * shot's own end (a shot-final event is never lost) AND when no other entry of
 * the same shot both starts at that shot-local instant and plays GLOBALLY
 * contiguous with this entry (#1061, #1099), cutting away exactly on a hit
 * hands the hit to the cut, not to silence, and a re-play of the same source
 * span elsewhere on the output clock (a flashback) cannot claim it.
 *
 * Semantics are **per play** (#1080): each entry that shows an instant emits
 * that instant's events at its own global time, one source event re-played by a
 * flashback lands once per play, not once per film. "Emitted once" (#1009)
 * binds a single contiguous seam, where two entries share one on-screen
 * instant. Included events keep their shot-local `time` and also expose
 * `shotTime` plus `globalTime`.
 *
 * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time Maps in-range shot events to output time with half-open trim boundaries so a seam event is emitted exactly once.
 * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-time-transforms Applies the supported unity-rate affine mapping `globalTime = entry.start + event.time - entry.offset`, without claiming scale, reverse, or hold support.
 * @evidence requirements/editorial/scope-and-identity.md#editorial-story-film-order Keeps each source event's shot-local instant while assigning a distinct entry and global instant to every presentation replay.
 * @evidence requirements/editorial/scope-and-identity.md#editorial-source-preservation Copies the source event payload unchanged and adds entry, shot-local, and global placement facts instead of rewriting the source shot.
 * @evidence requirements/story/beats-and-causality.md#story-semantic-event-identity Preserves the event's stable source id across trims and repeated presentation placements instead of replacing it with a frame or sequence index.
 * @evidence requirements/story/story-clock-and-state.md#story-presentation-chronology Keeps source `shotTime` separate from the authored sequence's affine `globalTime`; it does not infer chronology, reverse, or causal order.
 * @evidence requirements/staging/events-and-timing.md#staging-fixed-film-clock Converts each included shot-local event through the entry's trim offset and output start into one explicit global film-clock instant.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline Projects trimmed events from shot-local seconds to deterministic output seconds while preserving per-play ownership.
 * @evidence specifications/editorial-render-and-delivery/editorial-version-conform-and-validation.md#spec-editorial-film-identity Preserves the source occurrence and represents each authored presentation placement as separate film-order data.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-semantic-event-occurrence Keeps one semantic event identity while separating every replayed sequence occurrence by its placement data.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-chronology-presentation Exposes the supported unity-rate source-to-presentation placement without rewriting source event time as story chronology.
 * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-event-boundary-sampling-output Maps every admitted occurrence onto the production clock and assigns a contiguous trim-boundary occurrence to exactly one play.
 */
export const sequenceEventTimeline = (
  sequence: IAutoMovieSequence,
  shots: IAutoMovieShot[],
): IAutoMoviePlaybackEvent[] => {
  const timeline = sequenceTimeline(sequence, shots);
  const byId = indexShots(shots);
  const events: IAutoMoviePlaybackEvent[] = [];
  const entriesByShot = new Map<string, IAutoMoviePlaybackEntry[]>();
  for (const entry of timeline.entries) {
    const list = entriesByShot.get(entry.shot) ?? [];
    list.push(entry);
    entriesByShot.set(entry.shot, list);
  }
  for (const entry of timeline.entries) {
    const shot = byId.get(entry.shot)!.shot;
    const from = entry.offset;
    const to = entry.offset + entry.played;
    const globalEnd = entry.start + entry.played;
    const atShotEnd = Math.abs(to - shot.duration) <= 1e-9;
    // An event landing EXACTLY on this entry's trim end belongs to the entry
    // that starts there (#1009), but ONLY when that entry plays globally
    // contiguous with this one, sharing the on-screen instant. A same-shot
    // entry re-playing the source span elsewhere on the output clock (a
    // flashback) owns nothing here: shot-local coincidence alone suppressed
    // the flashback's own cut hit into silence (#1099). And when no entry
    // qualifies at all, this entry keeps the event (#1061).
    const ownedElsewhere = (time: number): boolean =>
      entriesByShot
        .get(entry.shot)!
        .some(
          (other) =>
            Math.abs(other.offset - time) <= 1e-9 &&
            Math.abs(other.start - globalEnd) <= 1e-9,
        );
    for (const event of shot.events ?? []) {
      if (event.time < from - 1e-9) continue;
      if (
        atShotEnd
          ? event.time > to + 1e-9
          : Math.abs(event.time - to) <= 1e-9
            ? ownedElsewhere(event.time)
            : event.time >= to - 1e-9
      )
        continue;
      events.push({
        ...event,
        entry: entry.entry,
        shot: entry.shot,
        shotTime: event.time,
        globalTime: entry.start + (event.time - entry.offset),
      });
    }
  }
  return events.sort(
    (a, b) =>
      a.globalTime - b.globalTime ||
      a.entry - b.entry ||
      compareCodeUnits(a.id, b.id),
  );
};
