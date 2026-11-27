import type { IAutoMovieMotionHumanTurnOver } from "@automovie/interface";
import { AutoMovieMotionHumanRefusal, sleep } from "@automovie/motions/internal";
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
 * `sleep` turns a lying performer over `changes` times, each into a position
 * drawn by its share of the night (Skarpsno et al. 2017) and never the one it
 * lies in, holding still between: each turn takes up to two quarter turns of a
 * second, and the rest of the sleep is shared out over seeded holds.
 *
 * Scenarios, a 20 s sleep with three changes on seed 7:
 *
 * 1. It appends three `turnOver`s, no two in a row to the same position.
 * 2. Their holds sum to less than the 20 - 2 x 3 = 14 s left after the turns.
 * 3. The same seed draws the same turns.
 * 4. No change, and three changes in 6 s, are refused on `changes` and `duration`.
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
