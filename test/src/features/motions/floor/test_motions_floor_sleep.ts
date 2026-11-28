import type { IAutoMovieMotionHumanTurnOver } from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  sleep
} from "../../../../../packages/motions/src/floor/internal/sleep";
import { TestValidator } from "@nestia/e2e";

/** Rounding of a few sums, seconds. */
const ROUNDING: number = 1e-9;

/** A chain that records what a sleep appends to it. */
interface IRecorder extends sleep.IChain<IRecorder> {
  /** The registered names, in order. */
  names: string[];

  /** The turns' parameters, in order. */
  turns: IAutoMovieMotionHumanTurnOver[];
}

/**
 * Check the generated sequence of resting holds and turns.
 *
 * Scenarios:
 *
 * 1. Generate 20 s of sleep with three position changes. Neighboring
 *    positions differ and the positive holds fit the time left by the turns.
 * 2. Repeat with the same seed for the same sequence. Refuse zero changes and
 *    a six-second duration for three changes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios specify the change count, hold budget, seed and invalid requests.
 * @evidence contracts/development/testing.md#behavioral-verification The recorded chain checks the emitted positions, hold budget, deterministic seed and inadmissible options.
 * @evidence contracts/development/testing.md#independent-expectations The available hold budget is 20 s less three two-second turns, and the second run is compared with the first recorded sequence.
 */
export function test_motions_floor_sleep(): void {
  const recorded = (): IRecorder => {
    const recorder: IRecorder = {
      names: [],
      turns: [],
      registered: (
        name: string,
        params: IAutoMovieMotionHumanTurnOver,
      ): IRecorder => {
        recorder.names.push(name);
        recorder.turns.push(params);
        return recorder;
      },
    };
    return sleep(recorder, { duration: 20, changes: 3, seed: 7 });
  };
  const once: IRecorder = recorded();
  TestValidator.predicate(
    "the turns",
    once.names.length === 3 &&
      once.names.every((name: string): boolean => name === "turnOver") &&
      once.turns[0]!.to !== once.turns[1]!.to &&
      once.turns[1]!.to !== once.turns[2]!.to,
  );
  let held: number = 0;
  for (const turn of once.turns) if (turn.hold !== undefined) held += turn.hold;
  TestValidator.predicate("the holds", held > 0 && held < 14 + ROUNDING);
  TestValidator.equals("replayed", recorded().turns, once.turns);
  const refused = (duration: number, changes: number): string => {
    try {
      sleep(recorded(), { duration, changes, seed: 7 });
    } catch (error: unknown) {
      if (error instanceof AutoMovieMotionHumanRefusal) return error.axis;
    }
    return "admitted";
  };
  TestValidator.equals(
    "refusals",
    [refused(20, 0), refused(6, 3)],
    ["changes", "duration"],
  );
}
