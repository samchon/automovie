import type {
  IAutoMovieCut,
  IAutoMovieEditPlan,
  IAutoMovieSequence,
  IAutoMovieSequenceEntry,
  IAutoMovieShot,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { checkCutPropContinuity } from "./checkCutPropContinuity";
import { sequenceEventTimeline } from "./sequenceEventTimeline";

/**
 * A built shot with the index it was first supplied at.
 */
interface IBuiltShot {
  /** The first shot supplied under the id. */
  shot: IAutoMovieShot;

  /** Its index in `shots`, for duplicate and duration reports. */
  index: number;
}

/** A requirement for one exact event on one play of a shot in the cut. */
type RequiredEvent = NonNullable<IAutoMovieEditPlan["requiredEvents"]>[number];

/**
 * The ASSEMBLE consumer: fold the editor's cut-list into an {@link IAutoMovieSequence} over the shots the pipeline actually built, or return every violation at once.
 *
 * The layout gates are editorial arithmetic. Built shot ids are unique; the sequence id and each entry's shot id are non-blank; the frame rate is finite and positive; there is at least one entry; every entry names a built shot whose duration is finite and positive; a trim has a finite positive duration and a finite start, and lies inside `[0, shot.duration]`; the first entry has no transition; and a transition is finite and positive, no longer than either neighbour's played span, and does not overlap the previous entry's own incoming transition inside that entry. Pacing and continuity rationale stay prose.
 *
 * `runtime` is in seconds: the sum of each entry's played span (its trim's duration, else the whole shot) minus each transition's duration, since a transition overlaps the previous entry's tail. A clean plan whose accumulated clock is non-finite is refused at entries instead of publishing an unusable runtime. For a structurally valid cut, each required event must appear exactly once in the named playback entry after trim and seam ownership. The event requirement reads built shot interaction events. Declared prop requirements compare sampled object-motion channels from the two retained sides of hard cuts. An absent requirement slot is refused. Outer records and populated entry objects are typed premises; an absent array slot is reported explicitly. The sequence copies the plan's id, name, frame rate and entries in order, sharing each trim and transition object by reference.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The edit clock follows [OpenTimelineIO time ranges](https://github.com/AcademySoftwareFoundation/OpenTimelineIO/blob/main/docs/tutorials/time-ranges.md#markers), with source instants placed in a parent timeline. One ordered pass carries the previous entry's played span and incoming transition, which is all an OpenTimelineIO-style end-to-end track needs to check overlaps and accumulate runtime; a later check is skipped when an earlier fault leaves its operand undefined, such as an unknown shot or an invalid trim, so one cause is not reported twice. After layout admission, the number of projected matches for each entry and event address must be one and each declared prop channel must agree within its tolerance at its hard cut.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Validates and assembles in one function because every check reads the same running timeline state; event requirements reuse `sequenceEventTimeline` after edit admission to respect the same trim and seam rules as playback. Prop comparisons delegate to checkCutPropContinuity.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Names no shot or fixture, and refuses an out-of-range trim or transition with its overshoot rather than clamping it into range.
 * @evidence contracts/development/common.md#meaningful-documentation States every gate with its bound, which transitions are compared with which played spans, the runtime formula and unit, and what the sequence copies or shares.
 * @evidence contracts/development/implementation.md#efficient-algorithms Edits without requirements take linear time in shots plus entries with one shot index. When event requirements exist, one event projection and sort are followed by one pass to index placed events and one constant-time lookup per event requirement. Prop requirements use one clip sample per addressed entry side plus per-channel comparisons.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All required events share one playback projection and one per-entry count index. Prop checks share the samples at each addressed entry side within the cut.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The projected events, count index and prop samples are local to assembly. The result owns a new sequence and entry list or a violation list bounded by the input shots, entries and requirements.
 */
export function cutSequence(
  assemble: IAutoMovieEditPlan,
  shots: IAutoMovieShot[],
): IAutoMovieCut {
  const out: IAutoMovieViolationCollector = new ViolationCollector();
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

  function validateNonEmptyId(id: string, path: string, label: string): void {
    if (id.trim().length === 0)
      out.push("type", path, `${label} must be a non-empty id`, id);
  }

  validateNonEmptyId(assemble.sequence.id, "$input.sequence.id", "sequence id");

  if (!Number.isFinite(assemble.fps) || !(assemble.fps > 0))
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

  let runtime: number = 0;
  let previousPlayed: number | null = null;
  let previousIncomingTransition: number = 0;
  assemble.entries.forEach(
    (entry: IAutoMovieSequenceEntry, i: number): void => {
      validateNonEmptyId(entry.shot, `$input.entries[${i}].shot`, "shot id");
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
      const validShotDuration: boolean =
        Number.isFinite(shot.duration) && shot.duration > 0;
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
      if (entry.trim !== null) {
        const start: number = entry.trim.start;
        const duration: number = entry.trim.duration;
        if (!Number.isFinite(duration) || !(duration > 0)) {
          validPlayedSpan = false;
          out.push(
            "range",
            `$input.entries[${i}].trim.duration`,
            `trim duration must be a finite number > 0 seconds, but was ${duration}`,
            duration,
          );
        } else if (!Number.isFinite(start)) {
          validPlayedSpan = false;
          out.push(
            "range",
            `$input.entries[${i}].trim.start`,
            `trim start must be a finite number >= 0 seconds, but was ${start}`,
            start,
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
            entry.trim,
            Math.max(-start, start + duration - shot.duration),
          );
        } else played = duration;
      }
      if (entry.transition !== null) {
        if (i === 0)
          out.push(
            "type",
            `$input.entries[0].transition`,
            "the first entry has nothing to transition from",
            entry.transition,
          );
        else if (
          !Number.isFinite(entry.transition.duration) ||
          !(entry.transition.duration > 0)
        )
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

  if (out.items.length === 0 && !Number.isFinite(runtime))
    out.push(
      "range",
      "$input.entries",
      "the assembled runtime must be finite seconds",
      runtime,
    );
  if (out.items.length > 0) return { success: false, violations: out.items };

  const sequence: IAutoMovieSequence = {
    id: assemble.sequence.id,
    name: assemble.sequence.name,
    shots: assemble.entries.map(
      (entry: IAutoMovieSequenceEntry): IAutoMovieSequenceEntry => ({
        shot: entry.shot,
        trim: entry.trim,
        transition: entry.transition,
      }),
    ),
    fps: assemble.fps,
  };

  const requiredEvents: readonly RequiredEvent[] = assemble.requiredEvents ?? [];
  if (requiredEvents.length > 0) {
    const counts: Map<number, Map<string, number>> = new Map();
    for (const event of sequenceEventTimeline(sequence, shots)) {
      const entryCounts: Map<string, number> =
        counts.get(event.entry) ?? new Map();
      entryCounts.set(event.id, (entryCounts.get(event.id) ?? 0) + 1);
      counts.set(event.entry, entryCounts);
    }
    for (let index: number = 0; index < requiredEvents.length; index++) {
      const requirement: RequiredEvent | undefined = requiredEvents[index];
      const path: string = `$input.requiredEvents[${index}]`;
      if (requirement === undefined) {
        out.push("type", path, "event requirement is absent", undefined);
        continue;
      }
      const validEntry: boolean =
        Number.isInteger(requirement.entry) &&
        requirement.entry >= 0 &&
        requirement.entry < sequence.shots.length;
      if (!validEntry)
        out.push(
          "range",
          `${path}.entry`,
          "required event must address a playback entry by zero-based index",
          requirement.entry,
        );
      validateNonEmptyId(requirement.event, `${path}.event`, "event id");
      if (!validEntry || requirement.event.trim().length === 0) continue;

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
  const requiredProps: NonNullable<IAutoMovieEditPlan["requiredPropContinuity"]> =
    assemble.requiredPropContinuity ?? [];
  if (requiredProps.length > 0)
    checkCutPropContinuity(
      sequence,
      requiredProps,
      (id: string): IAutoMovieShot => byId.get(id)!.shot,
      out,
    );
  if (out.items.length > 0) return { success: false, violations: out.items };
  return { success: true, sequence, runtime };
}
