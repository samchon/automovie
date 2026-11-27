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
 * Resolve a staged cue's latency on its declared clock.
 *
 * Scenarios:
 *
 * 1. A zero-quantile acoustic draw for an elite performer keeps its 0.18 s mean.
 *    An advance cue subtracts the elite's 0.05 s lead.
 * 2. Negative normal draws hit the distinct floor for reactions and authored
 *    delays, even with the same noise source.
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
