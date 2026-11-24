import type { IAutoMovieIntent } from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import { HumanRefusal, sleep } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { compositionIntents } from "../../../internal/compositionIntents";
import { nclose } from "../../../internal/nclose";

/** Rounding of a few sums, seconds. */
const ROUNDING: number = 1e-9;

/**
 * `sleep` turns a lying performer over `changes` times, each into a position
 * drawn by its share of the night (Skarpsno et al. 2017) and never the one it
 * lies in, holding still between: each turn takes up to two quarter turns of a
 * second, and the rest of the sleep is shared out over seeded holds.
 *
 * Scenarios, a 20 s sleep with three changes on seed `night`:
 *
 * 1. It appends three `turnOver`s, no two in a row to the same position.
 * 2. Their holds sum to less than the 20 - 2 x 3 = 14 s left after the turns.
 * 3. The same seed draws the same turns.
 * 4. No change, and three changes in 6 s, are refused on `changes` and `duration`.
 */
export function test_unit_motions_floor_sleep(): void {
  const turns: () => IAutoMovieIntent[] = (): IAutoMovieIntent[] =>
    compositionIntents(
      sleep(HumanChain.subject("a"), {
        duration: 20,
        changes: 3,
        seed: "night",
      }).node,
    );
  const once: IAutoMovieIntent[] = turns();
  const params: { to: string; hold: number }[] = once.map(
    (i: IAutoMovieIntent): { to: string; hold: number } =>
      i.parameters?.params as { to: string; hold: number },
  );
  TestValidator.predicate(
    "the turns",
    once.length === 3 &&
      once.every(
        (i: IAutoMovieIntent): boolean => i.capability === "turnOver",
      ) &&
      params[0]!.to !== params[1]!.to &&
      params[1]!.to !== params[2]!.to,
  );
  const held: number = params.reduce(
    (sum: number, p: { hold: number }): number => sum + p.hold,
    0,
  );
  TestValidator.predicate("the holds", held > 0 && held < 14 + ROUNDING);
  TestValidator.equals("replayed", turns(), once);
  TestValidator.predicate(
    "the same holds",
    nclose(
      held,
      turns()
        .map(
          (i: IAutoMovieIntent): number =>
            (i.parameters?.params as { hold: number }).hold,
        )
        .reduce((a: number, b: number): number => a + b, 0),
      ROUNDING,
    ),
  );
  const refused: (duration: number, changes: number) => string = (
    duration: number,
    changes: number,
  ): string => {
    try {
      sleep(HumanChain.subject("a"), { duration, changes, seed: "night" });
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
