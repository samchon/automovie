import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanDance,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieScheduleCue,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * The beat clock every dance law shares (#3253, #3991, #4010): beat `k` at
 * `lead + (k - 1) period`. Unlocked, the period is `60 / bpm` and the lead
 * one period; locked to a cue track, the beats are the track's instants at
 * or after the start, at their mean interval, the first at the track's
 * first beat. With `exact`, a locked beat keeps its own instant instead of
 * the mean grid (the waltz box follows a drifting score beat by beat).
 *
 * @param context The action's context, read for its start and cue tracks.
 * @param bpm The tempo when unlocked, beats per minute.
 * @param beats How many beats.
 * @param lock The cue track to lock to, if any.
 * @param exact Whether a locked beat keeps its own instant.
 * @returns The period, the lead and the beat reader.
 * @throws {HumanRefusal} When the tempo is not positive, the count is not a positive whole number, or the locked track has too few beats.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the beat rule, the lock and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation The locked period is the mean interval of the track's beats; the unlocked one is the tempo's.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, lock, period, reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The beat is never moved by a manner or a step.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the track's cues; each beat read is constant time.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The one beat rule for the dance, tap, ballet and street laws.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the locked instants only.
 */
export function prepareDanceBeats(
  context: Pick<IAutoMovieMotionHumanActionContext, "cue" | "start">,
  bpm: number,
  beats: number,
  lock: IAutoMovieMotionHumanDance.IParams["lock"],
  exact: boolean = false,
): IAutoMovieMotionHumanDanceBeats {
  HumanBound.above("bpm", bpm, 0, "beats per minute");
  HumanBound.whole("beats", beats);
  const locked: readonly number[] | null =
    lock === undefined
      ? null
      : context
          .cue(lock.of)
          .filter(
            (c: IAutoMovieScheduleCue): boolean =>
              c.name === (lock.event ?? "beat") &&
              c.seconds >= context.start - 1e-9,
          )
          .slice(0, beats)
          .map((c: IAutoMovieScheduleCue): number => c.seconds - context.start);
  if (
    lock !== undefined &&
    locked !== null &&
    locked.length < Math.min(2, beats)
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "lock",
      value: lock,
      feasible: null,
      reason: `the track ${lock.of} has ${locked.length} ${lock.event ?? "beat"} instants after the step starts, fewer than the ${Math.min(2, beats)} a tempo needs`,
      fix: "lock to a track with beats after the step's start, or give bpm instead",
    });
  // A single locked beat has no interval of its own, so it keeps the
  // tempo's: its offset from the start is a lead, not a period.
  const period: number =
    locked === null || locked.length < 2
      ? 60 / bpm
      : (locked[locked.length - 1]! - locked[0]!) / (locked.length - 1);
  HumanBound.above("beat interval", period, 0, "s");
  const lead: number = locked === null ? period : locked[0]!;
  return {
    period,
    lead,
    beats,
    at: (k: number): number =>
      (exact ? locked?.[k - 1] : undefined) ?? lead + (k - 1) * period,
  };
}
