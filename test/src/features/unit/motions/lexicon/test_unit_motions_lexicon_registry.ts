import type { IAutoMovieMotionHumanActionLaw } from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HUMAN_LEXICON_FAMILIES,
  HumanGait,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HUMAN_LEXICON` registers, by family, exactly the laws each family's record
 * names (`HUMAN_LEXICON_FAMILIES`), in their declared order, with no probe of
 * what a namespace exports.
 *
 * Scenarios:
 *
 * 1. Every family registers its record's laws, one for one and in order.
 * 2. The gait family holds the stroll and none of the gait namespace's other
 *    members: a gait's march parameters (`HumanGait.MARCH`) are no law.
 */
export function test_unit_motions_lexicon_registry(): void {
  // 1. One for one.
  TestValidator.predicate(
    "each family registers its record's laws in order",
    Object.entries(HUMAN_LEXICON_FAMILIES).every(
      ([family, laws]: [string, object]): boolean => {
        const named: unknown[] = Object.values(laws);
        const rows: readonly IAutoMovieMotionHumanActionLaw<never>[] =
          HUMAN_LEXICON[family]!;
        return (
          rows.length === named.length &&
          rows.every(
            (row: IAutoMovieMotionHumanActionLaw<never>, i: number): boolean =>
              row === named[i],
          )
        );
      },
    ),
  );

  // 2. The gait family.
  const gait: readonly IAutoMovieMotionHumanActionLaw<never>[] =
    HUMAN_LEXICON.gait!;
  TestValidator.predicate(
    "the gait family holds its laws alone",
    new Set<unknown>(gait).has(HumanGait.stroll) &&
      !new Set<unknown>(gait).has(HumanGait.MARCH),
  );
}
