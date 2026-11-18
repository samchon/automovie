import type { IAutoMovieMotionHumanActionLaw } from "@automovie/interface";
import { HUMAN_LEXICON } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Named resting stances select the intended site for each hand.
 *
 * Scenarios:
 * 1. Bilateral rest overrides both hands at the same site. The thinking stance sends the hands to different sites.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the hand routing.
 * @evidence contracts/development/testing.md#behavioral-verification Uses each public stance resolver.
 * @evidence contracts/development/testing.md#independent-expectations The named pose determines the anatomical hand sites.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers bilateral and asymmetric rest. The base stance, kneeling, floor, crouching and flinch tests own the displayed geometry on their performer fixtures.
 * @evidence contracts/development/testing.md#execution-ownership Parameter routing needs no body.
 */
export function test_human_motion_lexicon_rows_posture(): void {
  const sites: ReadonlyMap<string, Hands> = new Map<string, Hands>([
    ["armsCrossed", ["crossed", "crossed"]],
    ["handsOnHips", ["hip", "hip"]],
    ["handsInPockets", ["pocket", "pocket"]],
    ["paradeRest", ["claspedBehind", "claspedBehind"]],
    ["handsClasped", ["claspedFront", "claspedFront"]],
    ["handsBehindHead", ["behindHead", "behindHead"]],
    ["thinking", ["elbowSupport", "chinRest"]],
  ]);
  const registered: readonly IAutoMovieMotionHumanActionLaw<never>[] =
    HUMAN_LEXICON.stance!.filter(
      (row: IAutoMovieMotionHumanActionLaw<never>): boolean =>
        row.family === "rest",
    );
  const byName: (left: string, right: string) => number = (
    left: string,
    right: string,
  ): number => left.localeCompare(right);
  TestValidator.equals(
    "registered rest stances",
    registered
      .map((row: IAutoMovieMotionHumanActionLaw<never>): string => row.name)
      .sort(byName),
    [...sites.keys()].sort(byName),
  );
  for (const row of registered) {
    const [left, right]: Hands = sites.get(row.name)!;
    TestValidator.equals(
      row.name + " hand sites",
      row.resolve?.({ left: "free", right: "free" }),
      { left, right },
    );
  }
}

/** The left and right hand sites fixed by a resting stance. */
type Hands = readonly [string, string];
