import type { IAutoMovieScheduleCue } from "@automovie/interface";
import { prepareDanceBeats } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** Rounding of a mean interval, seconds. */
const ROUNDING: number = 1e-12;

/** A score's beats at 1.2, 1.7, 2.3 and 2.6 s, and one before the start. */
const SCORE: readonly IAutoMovieScheduleCue[] = [0.9, 1.2, 1.7, 2.3, 2.6].map(
  (seconds: number): IAutoMovieScheduleCue => ({ name: "beat", seconds }),
);

/**
 * `prepareDanceBeats` is the beat clock every dance shares: beat k at `lead +
 * (k − 1) period`. Unlocked, the period is `60 / bpm` and the lead one period;
 * locked to a cue track, the beats are the track's instants at or after the
 * start, at their mean interval, the first at the track's first beat, and with
 * `exact` each keeps its own instant.
 *
 * Scenarios, a step starting at 1 s:
 *
 * 1. Unlocked at 120 bpm: period and lead 0.5 s, beat 3 at 1.5 s.
 * 2. Locked to the score for four beats: the beats after the start are at 0.2,
 *    0.7, 1.3 and 1.6 s of the step, so the lead is 0.2 and the period (1.6 −
 *    0.2) / 3; beat 2 is on that grid, and with `exact` at its own 0.7 s.
 * 3. A track with one beat after the start for four beats, and a tempo of zero,
 *    are refused.
 */
export function test_unit_motions_exercise_dance_beats(): void {
  const context: Parameters<typeof prepareDanceBeats>[0] = {
    start: 1,
    cue: (): readonly IAutoMovieScheduleCue[] => SCORE,
  };

  // 1. Unlocked.
  const free: ReturnType<typeof prepareDanceBeats> = prepareDanceBeats(
    context,
    120,
    4,
    undefined,
  );
  TestValidator.predicate(
    "the tempo's grid",
    free.period === 0.5 && free.lead === 0.5 && free.at(3) === 1.5,
  );

  // 2. Locked.
  const lock: Parameters<typeof prepareDanceBeats>[3] = { of: "score" };
  const locked: ReturnType<typeof prepareDanceBeats> = prepareDanceBeats(
    context,
    120,
    4,
    lock,
  );
  TestValidator.predicate(
    "the track's mean grid, or its own instants",
    nclose(locked.lead, 0.2, ROUNDING) &&
      nclose(locked.period, 1.4 / 3, ROUNDING) &&
      nclose(locked.at(2), 0.2 + 1.4 / 3, ROUNDING) &&
      nclose(
        prepareDanceBeats(context, 120, 4, lock, true).at(2),
        0.7,
        ROUNDING,
      ),
  );

  // 3. Refusals.
  TestValidator.predicate(
    "too few beats and no tempo are refused",
    throwsError((): unknown =>
      prepareDanceBeats(
        { start: 2.5, cue: (): readonly IAutoMovieScheduleCue[] => SCORE },
        120,
        4,
        lock,
      ),
    ) &&
      throwsError((): unknown => prepareDanceBeats(context, 0, 4, undefined)),
  );
}
