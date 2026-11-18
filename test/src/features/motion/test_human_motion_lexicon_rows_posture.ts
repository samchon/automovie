import type { IAutoMovieMotionHumanActionLaw } from "@automovie/interface";
import { HUMAN_LEXICON } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { LexiconRowNet } from "../internal/LexiconRowNet";

/**
 * Named resting stances select the intended site for each hand and the drill rows accept their authored scenes.
 *
 * Scenarios:
 * 1. Bilateral rest overrides both hands at the same site. The thinking stance sends the hands to different sites.
 * 2. The drill records place their registered names from the solo and paired fixtures.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the hand routing and the drill placements.
 * @evidence contracts/development/testing.md#behavioral-verification Uses each public stance resolver and places the drill actions through the chain.
 * @evidence contracts/development/testing.md#independent-expectations The named pose determines the anatomical hand sites. The drill chain determines the expected placed name.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers bilateral and asymmetric rest. The base stance, kneeling, floor, crouching and flinch tests own the displayed geometry on their performer fixtures.
 * @evidence contracts/development/testing.md#execution-ownership Parameter routing needs no body. Each drill scene is constructed once per existing role assignment.
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
  TestValidator.equals(
    "drill entrances place both role assignments",
    LexiconRowNet.rows("drill"),
    [],
  );
}

/** The left and right hand sites fixed by a resting stance. */
type Hands = readonly [string, string];
