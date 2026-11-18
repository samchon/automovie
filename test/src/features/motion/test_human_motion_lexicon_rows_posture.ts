import { HUMAN_LEXICON } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { LexiconRowNet } from "../internal/LexiconRowNet";

/**
 * The lexicon registers fixed postures and drill entrances on opposite builds.
 *
 * The base pose and stance specs already build one performer per row and
 * check the displayed result. Build only the other performer here, and the
 * drill branches on their established fixtures. Both flinch rows are built
 * on both bodies by `test_human_motion_base_flinch_poses`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names this group's construction boundary and the body and scene variations it exercises.
 * @evidence contracts/development/testing.md#behavioral-verification Places the actual registered law under its authored name on the public chain. A refused or misnamed placement fails the case with the exact row and performer.
 * @evidence contracts/development/testing.md#independent-expectations A registered row must accept the authored fixture and appear under the name the chain asked to place.
 * @evidence contracts/development/testing.md#distinguishing-cases Complements the body already used for each posture by the base specs. Drill target and partner assignments are unchanged.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable test builds in-memory performances on prepared bodies. Each row owns only the registration it uses.
 */
export function test_human_motion_lexicon_rows_posture(): void {
  const averagePoses: readonly string[] = [
    "takeAKnee",
    "kneelSit",
    "sitCrossLegged",
    "lieStill",
    "takeCover",
    "braceForImpact",
    "startle",
    "wince",
  ];
  const smallPoses: readonly string[] = [
    "kneelBriefly",
    "sitOnFloor",
    "sitSideways",
    "squatSit",
    "stumble",
    "startle",
    "wince",
  ];
  // The base stance spec alternates bodies in registration order.
  const stances = HUMAN_LEXICON.stance!;
  const averageStances: string[] = stances
    .filter((_, index: number): boolean => index % 2 === 0)
    .map((law): string => law.name);
  const smallStances: string[] = stances
    .filter((_, index: number): boolean => index % 2 !== 0)
    .map((law): string => law.name);
  TestValidator.equals(
    "the fixed postures and drill entrances plan under their registered names",
    [
      ...LexiconRowNet.rows("drill"),
      ...LexiconRowNet.rows("pose", averagePoses, true, "m-average"),
      ...LexiconRowNet.rows("pose", smallPoses, true, "f-small"),
      ...LexiconRowNet.rows("stance", averageStances, true, "m-average"),
      ...LexiconRowNet.rows("stance", smallStances, true, "f-small"),
    ],
    [],
  );
}
