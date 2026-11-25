import type { IAutoMovieIntent } from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import { HumanRefusal, sleep } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { compositionIntents } from "../../../internal/compositionIntents";

/**
 * `sleep` turns a lying performer over `changes` times, each into a position
 * drawn by its share of the night (Skarpsno et al. 2017) and never the one it
 * lies in, holding still between: each turn takes up to two quarter turns of a
 * second, and the rest of the sleep is shared out over seeded holds.
 *
 * Scenarios, a 20 s sleep with three changes on seed 7:
 *
 * 1. It appends three `turnOver`s, no two in a row alike.
 * 2. The same seed draws the same turns.
 * 3. No change, and three changes in 6 s, are refused on `changes` and `duration`.
 */
export function test_unit_motions_floor_sleep(): void {
  const turns: () => IAutoMovieIntent[] = (): IAutoMovieIntent[] =>
    compositionIntents(
      sleep(HumanChain.subject("a"), {
        duration: 20,
        changes: 3,
        seed: 7,
      }).node,
    );
  const once: IAutoMovieIntent[] = turns();
  // Each turn's parameters as written, its position and its hold.
  const written: string[] = once.map((i: IAutoMovieIntent): string =>
    JSON.stringify(i.parameters),
  );
  TestValidator.predicate(
    "the turns",
    once.length === 3 &&
      once.every(
        (i: IAutoMovieIntent): boolean => i.capability === "turnOver",
      ) &&
      written[0] !== written[1] &&
      written[1] !== written[2],
  );
  TestValidator.equals("replayed", turns(), once);
  const refused: (duration: number, changes: number) => string = (
    duration: number,
    changes: number,
  ): string => {
    try {
      sleep(HumanChain.subject("a"), { duration, changes, seed: 7 });
    } catch (error: unknown) {
      if (error instanceof HumanRefusal) return error.axis;
    }
    return "admitted";
  };
  TestValidator.equals(
    "refusals",
    [refused(20, 0), refused(6, 3)],
    ["changes", "duration"],
  );
}
