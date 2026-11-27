import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanDance,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieScheduleCue,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";

/*
 * The beat clock every dance law shares: beat `k` at `lead + (k - 1) period`.
 * Unlocked, the period is `60 / bpm` and the lead one period; locked to a cue
 * track, the beats are the track's instants at or after the start, at their
 * mean interval, the first at the track's first beat. With `exact`, a locked
 * beat keeps its own instant instead of the mean grid (the waltz box follows a
 * drifting score beat by beat).
 * Parameter context: The action's context, read for its start and cue tracks.
 * Parameter bpm: The tempo when unlocked, beats per minute.
 * Parameter beats: How many beats.
 * Parameter lock: The cue track to lock to, if any.
 * Parameter exact: Whether a locked beat keeps its own instant.
 * Returns: The period, the lead and the beat reader.
 * When the tempo is not positive, the count is not a
 * positive whole number, or the locked track has too few beats.
 */
export function prepareDanceBeats(
  context: Pick<IAutoMovieMotionHumanActionContext, PrepareDanceBeatsContext>,
  bpm: number,
  beats: number,
  lock: IAutoMovieMotionHumanDance.IParams["lock"],
  exact: boolean = false,
): IAutoMovieMotionHumanDanceBeats {
  HumanBound.above("bpm", bpm, 0, "beats per minute");
  HumanBound.whole("count", beats);
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
    count: beats,
    at: (k: number): number =>
      (exact ? locked?.[k - 1] : undefined) ?? lead + (k - 1) * period,
  };
}

/*
 * The alternatives of `PrepareDanceBeatsContext`'s site.
 */
type PrepareDanceBeatsContext = "cue" | "start";
