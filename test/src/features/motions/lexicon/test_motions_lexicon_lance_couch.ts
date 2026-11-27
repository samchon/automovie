import {
  HumanLanceCouchPick
} from "../../../../../packages/motions/src/lexicon/internal/HumanLanceCouchPick";
import {
  StrikingRoll
} from "../../../../../packages/motions/src/striking/internal/StrikingRoll";
import { TestValidator } from "@nestia/e2e";

/**
 * The `HumanLanceCouch` law's carriage choice (`HumanLanceCouchPick`): the laid
 * carriages are tried from the least turn up, at most `TRIES` (12) of them, and
 * the first whose hand reaches within `StrikingRoll.MISS` is taken; when none
 * does, none is, with the least miss read.
 *
 * Scenarios:
 *
 * 1. Of carriages turned 30, 10 and 20 degrees missing 0.2, 0.05 and 0 m, the 10
 *    degree one is tried first and missed, then the 20 degree one is taken.
 * 2. When every tried carriage misses, none is taken and the least miss is kept.
 * 3. A carriage that would reach but lies past the twelfth turn is not tried.
 */
export function test_motions_lexicon_lance_couch(): void {
  const miss: Record<string, number> = { a: 0.2, b: 0.05, c: 0 };
  const reaches = (laid: string): number => miss[laid]!;
  TestValidator.predicate("a 5 cm miss is a miss", StrikingRoll.MISS < 0.05);
  TestValidator.equals(
    "the least turn that reaches",
    HumanLanceCouchPick<string>(
      [
        { laid: "a", turn: 30 },
        { laid: "b", turn: 10 },
        { laid: "c", turn: 20 },
      ],
      reaches,
    ),
    { laid: "c", miss: 0 },
  );
  TestValidator.equals(
    "none reaches",
    HumanLanceCouchPick<string>(
      [
        { laid: "a", turn: 30 },
        { laid: "a", turn: 10 },
      ],
      reaches,
    ),
    { laid: undefined, miss: 0.2 },
  );
  const far: HumanLanceCouchPick.IOption<string>[] = Array.from(
    { length: HumanLanceCouchPick.TRIES },
    (_: unknown, i: number): HumanLanceCouchPick.IOption<string> => ({
      laid: "a",
      turn: i,
    }),
  );
  TestValidator.equals(
    "past the tries",
    HumanLanceCouchPick<string>([...far, { laid: "c", turn: 99 }], reaches)
      .laid,
    undefined,
  );
}
