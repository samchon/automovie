import {
  IAutoMovieEditEntry,
  IAutoMovieEditPlan,
  IAutoMovieSequenceEntry,
  IAutoMovieShot,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMovieCut } from "./IAutoMovieCut";

/** A built shot with the index it was first supplied at. */
interface IBuiltShot {
  /** The first shot supplied under the id. */
  shot: IAutoMovieShot;

  /** Its index in `shots`, for duplicate and duration reports. */
  index: number;
}

/**
 * The ASSEMBLE consumer: fold the editor's cut-list into an
 * {@link IAutoMovieSequence} over the shots the pipeline actually built, or
 * return every violation at once.
 *
 * The gates are editorial arithmetic. Built shot ids are unique; the sequence
 * id and each entry's shot id are non-blank; the frame rate is finite and
 * positive; there is at least one entry; every entry names a built shot whose
 * duration is finite and positive; a trim has a finite positive duration and a
 * finite start, and lies inside `[0, shot.duration]`; the first entry has no
 * transition; and a transition is finite and positive, no longer than either
 * neighbour's played span, and does not overlap the previous entry's own
 * incoming transition inside that entry. Pacing and continuity stay prose,
 * because they have no deterministic verifier.
 *
 * `runtime` is in seconds: the sum of each entry's played span (its trim's
 * duration, else the whole shot) minus each transition's duration, since a
 * transition overlaps the previous entry's tail. The sequence copies the plan's
 * id, name, frame rate and entries in order, sharing each trim and transition
 * object by reference.
 *
 * @evidence contracts/common.md#principled-implementation One ordered pass that carries the previous entry's played span and incoming transition, which is all an OpenTimelineIO-style end-to-end track needs to check overlaps and accumulate runtime; a later check is skipped when an earlier fault leaves its operand undefined, such as an unknown shot or an invalid trim, so one cause is not reported twice.
 * @evidence contracts/common.md#clear-and-simple-design Validates and assembles in one function because every check reads the same running timeline state; per-instant timing is left to `sequenceTimeline`, which derives it from the sequence this returns.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no shot or fixture, and refuses an out-of-range trim or transition with its overshoot rather than clamping it into range.
 * @evidence contracts/common.md#meaningful-documentation States every gate with its bound, which transitions are compared with which played spans, the runtime formula and unit, and what the sequence copies or shares.
 * @evidence contracts/performance.md#efficient-algorithms Linear in shots plus entries: shots are indexed by id once and each entry is a map lookup with constant bookkeeping.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure gate over one edit plan and shot list that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing after return; the result owns a new sequence and entry list, or a violation list bounded by a few violations per shot and entry.
 */
export const cutSequence = (
  assemble: IAutoMovieEditPlan,
  shots: IAutoMovieShot[],
): IAutoMovieCut => {
  const out: ViolationCollector = new ViolationCollector();
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

  const validateNonEmptyId = (
    id: string,
    path: string,
    label: string,
  ): void => {
    if (id.trim().length === 0)
      out.push("type", path, `${label} must be a non-empty id`, id);
  };

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

  let runtime: number = 0;
  let previousPlayed: number | null = null;
  let previousIncomingTransition: number = 0;
  assemble.entries.forEach((entry: IAutoMovieEditEntry, i: number): void => {
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
        previousIncomingTransition + entry.transition.duration > previousPlayed
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
  });

  if (out.items.length > 0) return { success: false, violations: out.items };

  return {
    success: true,
    sequence: {
      id: assemble.sequence.id,
      name: assemble.sequence.name,
      shots: assemble.entries.map(
        (entry: IAutoMovieEditEntry): IAutoMovieSequenceEntry => ({
          shot: entry.shot,
          trim: entry.trim,
          transition: entry.transition,
        }),
      ),
      fps: assemble.fps,
    },
    runtime,
  };
};
