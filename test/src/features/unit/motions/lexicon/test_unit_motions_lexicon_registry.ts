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
 * 3. A row is its law with the row's preset fixed over the composition's
 *    parameters (`HumanActionRow`): `tuckHair` resolves the left hand's
 *    request to the stroke of the relaxed index fingertip from 0.065 up and
 *    0.135 forward of the right ear to 0.018 up, 0.055 behind and 0.035 out of
 *    it, mirrored; `eatWith` keeps the held utensil and its point and fixes the
 *    visit to the mouth for a beat in a fist. Both are rows of `armPhrase`.
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

  // 3. A row fixes its preset.
  const tuck: IAutoMovieMotionHumanActionLaw<object> =
    HUMAN_LEXICON_FAMILIES.upperTouch.tuckHair;
  const eat: IAutoMovieMotionHumanActionLaw<object> =
    HUMAN_LEXICON_FAMILIES.upperPhrase.eatWith;
  TestValidator.equals(
    "the rows' family and preset",
    [
      tuck.family,
      tuck.resolve?.({ hand: "left" }),
      eat.family,
      eat.resolve?.({ held: "fork", point: "face", hand: "right" }),
    ],
    [
      "armPhrase",
      {
        hand: "left",
        phrase: "stroke",
        target: { kind: "self", region: "earRight" },
        mirror: true,
        surface: "indexTip",
        shape: "relaxed",
        offset: { out: 0.035, up: 0.018, forward: -0.055 },
        from: { out: 0, up: 0.065, forward: 0.135 },
      },
      "armPhrase",
      {
        held: "fork",
        point: "face",
        hand: "right",
        phrase: "visit",
        target: { kind: "self", region: "mouth" },
        surface: "grip",
        shape: "fist",
        hold: "beat",
      },
    ],
  );
}
