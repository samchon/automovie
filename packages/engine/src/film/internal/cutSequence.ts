import type {
  IAutoMovieCut,
  IAutoMovieEditPlan,
  IAutoMovieSequence,
  IAutoMovieSequenceEntry,
  IAutoMovieShot,
  IAutoMovieTrim,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { overflowsBinary64 } from "../../math/internal/overflowsBinary64";
import { AutoMovieEngineViolationCollector } from "../../validation/AutoMovieEngineViolationCollector";
import { checkCutPropContinuity } from "./checkCutPropContinuity";
import { sequenceEventTimeline } from "./sequenceEventTimeline";

/*
 * The ASSEMBLE consumer: fold the editor's cut-list into an
 * IAutoMovieSequence over the shots the pipeline actually built, or
 * return every violation at once.
 *
 * The layout gates are editorial arithmetic. Built shot ids are unique; the
 * frame rate is finite and positive; there is at least one entry; every entry
 * names a built shot whose duration is finite and positive; a trim has a finite
 * positive duration and a finite start, and lies inside `[0, shot.duration]`;
 * the entry rate is finite and positive with a representable positive output
 * span; the first entry has no transition; and a transition is finite and
 * positive, no longer than either neighbour's played span, and does not overlap
 * the previous entry's own incoming transition inside that entry. An event trim
 * resolves two exact, uniquely occurring built shot events to the same numeric
 * source span before these checks. Pacing and continuity rationale stay prose.
 *
 * `runtime` is in seconds: the sum of each entry's played output span (retained
 * source duration divided by the entry rate) minus each transition's duration,
 * since a transition overlaps the previous entry's tail. An unrepresentable
 * runtime is refused at entries. Each event requirement addresses one playback
 * entry and must match one built shot interaction event after trim and seam
 * ownership. Prop requirements compare sampled object-motion channels on the
 * two retained sides of hard cuts. Requirement lists and records are checked
 * before their fields are read. The sequence copies the plan's id, name, frame
 * rate and entries in order, borrowing numeric trim and transition objects,
 * lowering event trims with exact source ends, and recording only nondefault
 * playback rates.
 */
export function cutSequence(
  assemble: IAutoMovieEditPlan,
  shots: IAutoMovieShot[],
): IAutoMovieCut {
  const out: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  const byId: Map<string, IBuiltShot> = new Map();
  shots.forEach((shot: IAutoMovieShot, index: number): void => {
    const existing: IBuiltShot | undefined = byId.get(shot.id);
    if (existing !== undefined) {
      out.push(
        "type",
        `$shots[${index}].id`,
        `shot id "${shot.id}" is duplicated; first declared at $shots[${existing.index}].id`,
        shot.id,
      );
      return;
    }
    byId.set(shot.id, { shot, index });
  });

  if (!(assemble.fps > 0))
    out.push(
      "range",
      "$input.fps",
      `frame rate must be a finite number > 0, but was ${assemble.fps}`,
      assemble.fps,
    );
  if (assemble.entries.length === 0)
    out.push(
      "type",
      "$input.entries",
      "a film must contain at least one shot",
      assemble.entries,
    );
  for (let index: number = 0; index < assemble.entries.length; index++)
    if (assemble.entries[index] === undefined)
      out.push(
        "type",
        `$input.entries[${index}]`,
        "every edit entry must name one built shot; an entry is absent",
        undefined,
      );

  /*
   * Index each symbolically trimmed shot only on its first use.
   */
  const eventTimesByShot: Map<string, Map<string, number | null>> = new Map();

  /*
   * Resolve one exact id, reporting absent, repeated and invalid bounds
   * individually.
   */
  function resolveEventBound(
    times: Map<string, number | null>,
    shot: IAutoMovieShot,
    id: string,
    path: string,
  ): number | undefined {
    const time: number | null | undefined = times.get(id);
    if (time === undefined || time === null) {
      out.push(
        "type",
        path,
        `trim event "${id}" must match exactly once in shot "${shot.id}"`,
        id,
      );
      return undefined;
    }
    if (time < 0 || time > shot.duration) {
      out.push(
        "range",
        path,
        `trim event "${id}" must have a finite time inside shot "${shot.id}" [0, ${shot.duration}]`,
        time,
      );
      return undefined;
    }
    return time;
  }

  /*
   * Lower ordered, admitted event times without reconstructing an end beyond
   * the source event.
   */
  function trimBetweenEvents(start: number, end: number): IAutoMovieTrim {
    let duration: number = end - start;
    if (start + duration > end) {
      // The rounded difference overshoots. Its binary64 predecessor is the
      // largest smaller duration and brings the reconstructed end in bounds.
      const bits: DataView = new DataView(new ArrayBuffer(8));
      bits.setFloat64(0, duration);
      bits.setBigUint64(0, bits.getBigUint64(0) - 1n);
      duration = bits.getFloat64(0);
    }
    return { start, duration };
  }

  /*
   * Store lowered source spans for the ordinary playback entries.
   */
  const trims: (IAutoMovieTrim | null)[] = [];
  const exactSourceEnds: Map<number, number> = new Map();
  let runtime: number = 0;
  let previousPlayed: number | null = null;
  let previousIncomingTransition: number = 0;
  assemble.entries.forEach(
    (entry: IAutoMovieEditPlan["entries"][number], i: number): void => {
      const found: IBuiltShot | undefined = byId.get(entry.shot);
      if (found === undefined) {
        out.push(
          "type",
          `$input.entries[${i}].shot`,
          `entry must reference a built shot, but "${entry.shot}" was never performed`,
          entry.shot,
        );
        previousPlayed = null;
        previousIncomingTransition = 0;
        return;
      }
      const shot: IAutoMovieShot = found.shot;
      const shotIndex: number = found.index;
      const validShotDuration: boolean = shot.duration > 0;
      if (!validShotDuration)
        out.push(
          "range",
          `$shots[${shotIndex}].duration`,
          `referenced shot "${shot.id}" duration must be a finite number > 0 seconds, but was ${shot.duration}`,
          shot.duration,
        );
      let played: number = shot.duration;
      let validPlayedSpan: boolean = validShotDuration;
      let incomingTransition: number = 0;
      let trim: IAutoMovieTrim | null = entry.trim;
      const bounds: IAutoMovieEditPlan["entries"][number]["trimByEvents"] =
        entry.trimByEvents;
      if (bounds !== undefined) {
        const path: string = `$input.entries[${i}].trimByEvents`;
        if (trim !== null) {
          validPlayedSpan = false;
          out.push(
            "type",
            path,
            "event trim requires numeric trim to be null",
            bounds,
          );
        } else if (validShotDuration) {
          let times: Map<string, number | null> | undefined =
            eventTimesByShot.get(shot.id);
          if (times === undefined) {
            times = new Map();
            for (const event of shot.events ?? [])
              times.set(event.id, times.has(event.id) ? null : event.time);
            eventTimesByShot.set(shot.id, times);
          }
          const start: number | undefined = resolveEventBound(
            times,
            shot,
            bounds.startEvent,
            `${path}.startEvent`,
          );
          const end: number | undefined = resolveEventBound(
            times,
            shot,
            bounds.endEvent,
            `${path}.endEvent`,
          );
          if (start === undefined || end === undefined) validPlayedSpan = false;
          else if (end <= start) {
            validPlayedSpan = false;
            out.push(
              "range",
              path,
              "the trim end event must follow the start event",
              bounds,
            );
          } else {
            trim = trimBetweenEvents(start, end);
            exactSourceEnds.set(i, end);
          }
        }
      }
      trims[i] = trim;
      if (trim !== null && (bounds === undefined || validPlayedSpan)) {
        const start: number = trim.start;
        const duration: number = trim.duration;
        if (!(duration > 0)) {
          validPlayedSpan = false;
          out.push(
            "range",
            `$input.entries[${i}].trim.duration`,
            `trim duration must be a finite number > 0 seconds, but was ${duration}`,
            duration,
          );
        } else if (
          validShotDuration &&
          (start < 0 || start + duration > shot.duration)
        ) {
          validPlayedSpan = false;
          out.push(
            "range",
            `$input.entries[${i}].trim`,
            `trim [${start}, ${start + duration}] must lie inside shot "${shot.id}" [0, ${shot.duration}]`,
            trim,
            Math.max(-start, start + duration - shot.duration),
          );
        } else played = duration;
      }
      const playbackRate: number =
        entry.playbackRate === undefined ? 1 : entry.playbackRate;
      if (!(playbackRate > 0)) {
        validPlayedSpan = false;
        out.push(
          "range",
          `$input.entries[${i}].playbackRate`,
          `playback rate must be finite and positive, but was ${playbackRate}`,
          playbackRate,
        );
      } else if (validPlayedSpan && playbackRate !== 1) {
        const start: number = runtime - (entry.transition?.duration ?? 0);
        played /= playbackRate;
        const end: number = start + played;
        if (!(played > 0) || overflowsBinary64(played)) {
          validPlayedSpan = false;
          out.push(
            "range",
            `$input.entries[${i}].playbackRate`,
            "the playback rate must produce a finite positive output duration",
            playbackRate,
          );
        } else if (!(end > start)) {
          validPlayedSpan = false;
          out.push(
            "range",
            `$input.entries[${i}].playbackRate`,
            "the output span is too short to advance the output clock",
            playbackRate,
          );
        }
      }
      if (entry.transition !== null) {
        if (i === 0)
          out.push(
            "type",
            `$input.entries[0].transition`,
            "the first entry has nothing to transition from",
            entry.transition,
          );
        else if (!(entry.transition.duration > 0))
          out.push(
            "range",
            `$input.entries[${i}].transition.duration`,
            `transition duration must be a finite number > 0 seconds, but was ${entry.transition.duration}`,
            entry.transition.duration,
          );
        else if (validPlayedSpan && entry.transition.duration > played)
          out.push(
            "range",
            `$input.entries[${i}].transition.duration`,
            `transition (${entry.transition.duration}s) must not outlast the entry's played span (${played}s)`,
            entry.transition.duration,
            entry.transition.duration - played,
          );
        else if (
          previousPlayed !== null &&
          entry.transition.duration > previousPlayed
        )
          out.push(
            "range",
            `$input.entries[${i}].transition.duration`,
            `transition (${entry.transition.duration}s) must not outlast the previous entry's played span (${previousPlayed}s)`,
            entry.transition.duration,
            entry.transition.duration - previousPlayed,
          );
        else if (
          previousPlayed !== null &&
          previousIncomingTransition + entry.transition.duration >
            previousPlayed
        )
          out.push(
            "range",
            `$input.entries[${i}].transition.duration`,
            `adjacent transitions (${previousIncomingTransition}s + ${entry.transition.duration}s) must not overlap inside the previous entry's played span (${previousPlayed}s)`,
            entry.transition.duration,
            previousIncomingTransition +
              entry.transition.duration -
              previousPlayed,
          );
        else {
          runtime -= entry.transition.duration;
          incomingTransition = entry.transition.duration;
        }
      }
      runtime += played;
      previousPlayed = validPlayedSpan ? played : null;
      previousIncomingTransition = validPlayedSpan ? incomingTransition : 0;
    },
  );

  if (out.items.length > 0) return { success: false, violations: out.items };

  const sequence: IAutoMovieSequence = {
    id: assemble.sequence.id,
    name: assemble.sequence.name,
    shots: assemble.entries.map(
      (
        entry: IAutoMovieEditPlan["entries"][number],
        index: number,
      ): IAutoMovieSequenceEntry => ({
        shot: entry.shot,
        trim: trims[index]!,
        ...(exactSourceEnds.has(index)
          ? { exactSourceEnd: exactSourceEnds.get(index)! }
          : {}),
        transition: entry.transition,
        ...(entry.playbackRate === undefined || entry.playbackRate === 1
          ? {}
          : { playbackRate: entry.playbackRate }),
      }),
    ),
    fps: assemble.fps,
  };

  const requiredEvents: readonly RequiredEvent[] | undefined =
    assemble.requiredEvents;
  if (requiredEvents !== undefined && requiredEvents.length > 0) {
    const counts: Map<number, Map<string, number>> = new Map();
    for (const event of sequenceEventTimeline(sequence, shots)) {
      const entryCounts: Map<string, number> =
        counts.get(event.entry) ?? new Map();
      entryCounts.set(event.id, (entryCounts.get(event.id) ?? 0) + 1);
      counts.set(event.entry, entryCounts);
    }
    for (let index: number = 0; index < requiredEvents.length; index++) {
      const requirement: RequiredEvent = requiredEvents[index]!;
      const path: string = `$input.requiredEvents[${index}]`;
      const validEntry: boolean =
        requirement.entry >= 0 && requirement.entry < sequence.shots.length;
      if (!validEntry)
        out.push(
          "range",
          `${path}.entry`,
          "required event must address a playback entry by zero-based index",
          requirement.entry,
        );
      if (!validEntry) continue;

      const count: number =
        counts.get(requirement.entry)?.get(requirement.event) ?? 0;
      if (count !== 1)
        out.push(
          "type",
          `${path}.event`,
          `entry ${requirement.entry} must retain exactly one event "${requirement.event}", but retains ${count}`,
          count,
        );
    }
  }
  const requiredProps: IAutoMovieEditPlan["requiredPropContinuity"] =
    assemble.requiredPropContinuity;
  if (requiredProps !== undefined && requiredProps.length > 0)
    checkCutPropContinuity(
      sequence,
      requiredProps,
      (id: string): IAutoMovieShot => byId.get(id)!.shot,
      out,
    );
  if (out.items.length > 0) return { success: false, violations: out.items };
  return { success: true, sequence, runtime };
}

/*
 * A built shot with the index it was first supplied at.
 */
interface IBuiltShot {
  /*
   * The first shot supplied under the id.
   */
  shot: IAutoMovieShot;

  /*
   * Its index in `shots`, for duplicate and duration reports.
   */
  index: number;
}

/*
 * A requirement for one exact event on one play of a shot in the cut.
 */
type RequiredEvent = NonNullable<IAutoMovieEditPlan["requiredEvents"]>[number];
