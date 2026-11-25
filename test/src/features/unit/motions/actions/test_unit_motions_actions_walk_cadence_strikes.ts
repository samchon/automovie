import { createAutoMovieRandom } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanWalkCadence,
  IAutoMovieRandom,
  IAutoMovieScheduleCue,
} from "@automovie/interface";
import { AutoMovieMotionHumanGait } from "@automovie/motions";
import { HumanSkill } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * The closed-form recurrence and two log-normal transformations stay below 16
 * s. Sixty-four binary64 rounding units at 16 s bound the comparison.
 */
const ROUNDING: number = 64 * Number.EPSILON * 16;

/**
 * Advance film-time footfalls by the phase-correction model's closed form.
 *
 * Scenarios:
 *
 * 1. The first left foot names beat 1, so the leading right foot names beat 0. An
 *    unrelated cue leaves the regular period unchanged. With gain 0.7, the
 *    second and third phase errors are 0.3 A + d and 0.09 A + 1.3 d, where d is
 *    the constant median timer deviation.
 * 2. After the last beat, the walk keeps its planned half-second intervals. A gait
 *    that cannot match a much slower beat is refused.
 */
export function test_unit_motions_actions_walk_cadence_strikes(): void {
  const random: IAutoMovieRandom = createAutoMovieRandom("0000000000000000");
  const centered: IAutoMovieRandom = {
    ...random,
    float: (index: number): number => (index === 0 ? 0.5 : 0.25),
  };
  const context: AutoMovieMotionHumanGait.walkCadence.IContext = {
    attributes: { discipline: 1 },
    start: 10.1,
    skill: HumanSkill.resolve({ level: "elite" }, "pace"),
    random: (): IAutoMovieRandom => centered,
    cue: (): readonly IAutoMovieScheduleCue[] => [
      { name: "beat", seconds: 10 },
      { name: "accent", seconds: 10.25 },
      { name: "beat", seconds: 10.5 },
      { name: "beat", seconds: 11 },
    ],
  };
  const strikes: IAutoMovieMotionHumanWalkCadence.IStrikesStrikes = [
    { side: "right", seconds: 0 },
    { side: "left", seconds: 0.5 },
    { side: "right", seconds: 1 },
    { side: "left", seconds: 1.5 },
  ];
  const cadence: IAutoMovieMotionHumanWalkCadence.ICadence = {
    cue: "pulse",
    foot: "left",
    index: 1,
  };
  const actual: number[] | null = AutoMovieMotionHumanGait.walkCadence.strikes(
    context,
    cadence,
    strikes,
  );
  const variance: number = 0.01 ** 2 + 0.0125 ** 2;
  const deviation: number = 0.5 / Math.sqrt(1 + variance / 0.25) - 0.5;
  const expected: readonly number[] = [
    10.1,
    10.53 + deviation,
    11.009 + 1.3 * deviation,
    11.509 + 1.3 * deviation,
  ];
  TestValidator.predicate(
    "the regular beats reduce the asynchrony and later intervals keep their own tempo",
    actual !== null &&
      actual.length === expected.length &&
      actual.every((t: number, index: number): boolean =>
        nclose(t, expected[index]!, ROUNDING),
      ),
  );
  TestValidator.predicate(
    "a beat every second exceeds the gait's allowed stretch",
    throwsError(
      (): unknown =>
        AutoMovieMotionHumanGait.walkCadence.strikes(
          {
            ...context,
            cue: (): readonly IAutoMovieScheduleCue[] => [
              { name: "beat", seconds: 10 },
              { name: "beat", seconds: 11 },
              { name: "beat", seconds: 12 },
            ],
          },
          cadence,
          strikes,
        ),
      "cadence",
    ),
  );
}
