import { AutoMovieEngineRandom } from "@automovie/engine";

import type {
  IAutoMovieMotionHumanSkill,
  IAutoMovieRandom,
} from "@automovie/interface";
import {
  HumanResponse
} from "../../../../../packages/motions/src/skill/internal/HumanResponse";
import {
  HumanSkill
} from "../../../../../packages/motions/src/skill/internal/HumanSkill";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Binary64 rounding allowance for three distribution terms below one second. */
const ROUNDING: number = 32 * Number.EPSILON;

/**
 * Check how skill, cue lead and input kind affect response latency.
 *
 * Scenarios:
 *
 * 1. With a centred acoustic draw, read the elite mean of 0.18 s and a
 *    prepared response of 0.13 s.
 * 2. Use the same early draw for a reaction and an authored wait. The
 *    reaction floors at 0.1 s and the authored wait at zero.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify clock units, lead and both distinct latency floors.
 * @evidence contracts/development/testing.md#behavioral-verification The latency resolver receives explicit fixture draws and the two supported input kinds.
 * @evidence contracts/development/testing.md#independent-expectations A zero-centred draw leaves the stated mean and the 0.05 s lead subtracts directly. The lower bounds are supplied as literal expectations.
 */
export function test_motions_skill_human_response(): void {
  const elite: IAutoMovieMotionHumanSkill = HumanSkill.resolve({ p: 1 }, "cue");
  const source: IAutoMovieRandom = AutoMovieEngineRandom.createRandom("0000000000000000");
  const centered: IAutoMovieRandom = {
    ...source,
    float: (index: number): number => [0.5, 0.25, 0][index]!,
  };
  const early: IAutoMovieRandom = {
    ...source,
    float: (index: number): number => [0.125, 0.5, 0][index]!,
  };
  TestValidator.predicate(
    "an announced cue contributes only its own preparation lead",
    nclose(
      HumanResponse.latency(elite, centered, "reaction", false, undefined),
      0.18,
      ROUNDING,
    ) &&
      nclose(
        HumanResponse.latency(elite, centered, "reaction", true, undefined),
        0.13,
        ROUNDING,
      ),
  );
  TestValidator.predicate(
    "the reaction floor is 0.1 seconds and the authored delay floor is zero",
    nclose(
      HumanResponse.latency(elite, early, "reaction", true, undefined),
      0.1,
      ROUNDING,
    ) &&
      HumanResponse.latency(
        elite,
        early,
        { mean: 0.01, spread: 0.125 },
        true,
        undefined,
      ) === 0,
  );
}
