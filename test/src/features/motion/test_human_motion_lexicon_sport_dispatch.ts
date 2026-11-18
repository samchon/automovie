import type { IAutoMovieMotionHumanActionLaw } from "@automovie/interface";
import { HUMAN_LEXICON } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The public sport catalogue resolves exercise, dance, swimming and ball techniques to their authored law parameters.
 *
 * Scenarios:
 * 1. Each authored name occurs exactly once in the public catalogue and identifies its expected law.
 * 2. Each named technique fixes its intended kind even if the caller supplies another kind.
 * 3. An alias without a fixed kind forwards the caller's parameters.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the public catalogue, its lookup and its fixed-parameter contract.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the resolver registered under each public name.
 * @evidence contracts/development/testing.md#independent-expectations The table pairs each authored technique with its underlying action and kind.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers fixed-kind rows and parameter-transparent rows, including kinds whose spelling differs from the public name.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public catalogue in memory and needs no performer or host.
 */
export function test_human_motion_lexicon_sport_dispatch(): void {
  const techniques: readonly Technique[] = [
    ["lunges", "exercise", "lunge"],
    ["highKnees", "exercise", "highKnees"],
    ["neckStretch", "stretch", "neckSide"],
    ["shoulderStretch", "stretch", "crossBody"],
    ["sideStretch", "stretch", "overheadSide"],
    ["quadStretch", "stretch", "quadriceps"],
    ["treePose", "stretch", "tree"],
    ["bounce", "dance", "bounce"],
    ["stepTouch", "dance", "stepTouch"],
    ["boxStep", "dance", "boxStep"],
    ["treadWater", "swim", "treadWater"],
    ["frontCrawl", "swim", "frontCrawl"],
    ["sprintStart", "athletics"],
    ["handstand", "gymnastics"],
    ["horseStance", "martialArt", "horseStance"],
    ["karatePunches", "martialArt", "chokuZuki"],
    ["taiChiPush", "martialArt", "taiChiPush"],
    ["dribble", "ballSport", "dribble"],
    ["volleyDig", "ballSport", "dig"],
    ["volleySet", "ballSport", "set"],
    ["throwIn", "ballSport", "throwIn"],
    ["catcherCrouch", "baseball", "catcherCrouch"],
    ["fieldGrounder", "baseball", "groundBall"],
    ["battingStance", "baseball", "battingStance"],
    ["readyPosition", "racket", "readyPosition"],
    ["splitStep", "racket", "splitStep"],
    ["golfAddress", "racket", "golfAddress"],
  ];
  const catalogue: readonly IAutoMovieMotionHumanActionLaw<never>[] =
    HUMAN_LEXICON.sport!;
  const byName: Map<string, IAutoMovieMotionHumanActionLaw<never>> = new Map();
  for (const row of catalogue) byName.set(row.name, row);
  TestValidator.equals("sport names are unique", byName.size, catalogue.length);
  for (const [name, family, kind] of techniques) {
    const row: IAutoMovieMotionHumanActionLaw<never> | undefined =
      byName.get(name);
    TestValidator.equals(name, row?.family, family);
    TestValidator.equals(
      `${name} resolves the authored parameters`,
      row?.resolve?.({ kind: "caller" }),
      { kind: kind ?? "caller" },
    );
  }
}

/** Public name, underlying action and the kind fixed by this alias, if any. */
type Technique = readonly [string, string, string?];
