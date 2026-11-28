import { AutoMovieEngineRandom } from "@automovie/engine";

import type {
  IAutoMovieMotionHumanSkill,
  IAutoMovieRandom,
} from "@automovie/interface";
import {
  HumanSkill
} from "../../../../../packages/motions/src/skill/internal/HumanSkill";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * At the fixture magnitudes, allow 64 binary64 relative rounding units at 4
 * seconds for arithmetic and log, exp, sqrt and cosine evaluations. The closed
 * forms use exact powers of two or a single logarithm.
 */
const ROUNDING: number = 64 * Number.EPSILON * 4;

/** The indexed engine stream supplies unused members of the controlled draws. */
const STREAM: IAutoMovieRandom = AutoMovieEngineRandom.createRandom("0000000000000000");

/** Supply the exact fractions used in each independent distribution oracle. */
function indexed(samples: readonly number[]): IAutoMovieRandom {
  return {
    ...STREAM,
    float: (index: number): number => {
      const sample: number | undefined = samples[index];
      if (sample === undefined) throw new Error(`Unexpected draw ${index}`);
      return sample;
    },
  };
}

/**
 * Check skill overrides and deterministic distribution replay.
 *
 * Scenarios:
 *
 * 1. Fill absent axes from the overall level, preserve explicit zero and one,
 *    and refuse values outside the interval. Compare the prescribed
 *    quarter-level blend and scatter.
 * 2. Replay a keyed sample, then change each address field and the series
 *    selection to obtain distinct stream keys.
 * 3. Compare fixed-input normal, ex-Gaussian and log-normal values. A
 *    zero-time scale takes no sample.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify the skill fields, key domains, distribution inputs and zero-time behavior.
 * @evidence contracts/development/testing.md#behavioral-verification The skill functions use indexed deterministic streams and separate oracles for resolution, mapping and timing.
 * @evidence contracts/development/testing.md#independent-expectations Literal fixed inputs give the interpolation and the standard normal transform, the independent exponential term and log-normal moment conversion.
 */
export function test_motions_skill_human_skill(): void {
  const novice: IAutoMovieMotionHumanSkill = HumanSkill.resolve(
    { level: "novice" },
    "take",
  );
  const trained: IAutoMovieMotionHumanSkill = HumanSkill.resolve(
    { level: "trained", axes: { timing: 0, path: 0.25, power: 1 } },
    "take",
  );
  TestValidator.equals("named skill fills each absent axis", trained, {
    p: 2 / 3,
    seed: "take",
    axes: {
      timing: 0,
      path: 0.25,
      balance: 2 / 3,
      guard: 2 / 3,
      power: 1,
      speed: 2 / 3,
      recovery: 2 / 3,
      reaction: 2 / 3,
      anticipation: 2 / 3,
      sequencing: 2 / 3,
    },
  });
  TestValidator.predicate(
    "both ends of the overall and axis ranges are admitted",
    HumanSkill.resolve({ p: 1 }, "take").axes.reaction === 1 &&
      throwsError((): unknown => HumanSkill.resolve({ p: -0.25 }, "take")) &&
      throwsError((): unknown => HumanSkill.resolve({ p: 1.25 }, "take")) &&
      throwsError(
        (): unknown =>
          HumanSkill.resolve({ p: 0.5, axes: { timing: 1.25 } }, "take"),
        "timing",
      ) &&
      throwsError(
        (): unknown =>
          HumanSkill.resolve({ p: 0.5, axes: { path: -0.25 } }, "take"),
        "path",
      ),
  );
  TestValidator.predicate(
    "the quarter axis eases a descending quantity to 8.75",
    nclose(HumanSkill.quantity(trained, "path", 10, 2), 8.75, ROUNDING),
  );
  TestValidator.predicate(
    "scatter scales with distance per second on the path axis",
    nclose(HumanSkill.scatter(trained, 3, 0.5), 0.0645, ROUNDING),
  );

  const draw: IAutoMovieRandom = HumanSkill.stream(
    trained,
    "A",
    "step",
    2,
    "timing",
  );
  const replay: IAutoMovieRandom = HumanSkill.stream(
    trained,
    "A",
    "step",
    2,
    "timing",
  );
  const keys: string[] = [
    draw.seed,
    HumanSkill.stream({ ...trained, seed: "other" }, "A", "step", 2, "timing")
      .seed,
    HumanSkill.stream(trained, "B", "step", 2, "timing").seed,
    HumanSkill.stream(trained, "A", "turn", 2, "timing").seed,
    HumanSkill.stream(trained, "A", "step", 3, "timing").seed,
    HumanSkill.stream(trained, "A", "step", 2, "path").seed,
    HumanSkill.series(trained, "A", "step", "timing").seed,
  ];
  TestValidator.equals("replayed indexed draw", replay.block(7), draw.block(7));
  TestValidator.equals(
    "separate draw domains",
    new Set(keys).size,
    keys.length,
  );

  const standard: number = -Math.sqrt(Math.log(4));
  TestValidator.predicate(
    "Box-Muller cosine keeps the sign and starts at the requested index",
    nclose(HumanSkill.normal(indexed([0.25, 0.5, 0.5]), 1), standard, ROUNDING),
  );
  TestValidator.predicate(
    "ex-Gaussian adds the separately indexed exponential",
    nclose(
      HumanSkill.reaction(
        { mu: 0.3, sigma: 0.125, tau: 0.25 },
        indexed([0.75, 0.5, 0.5, 0.5]),
        1,
      ),
      0.3 + 0.125 * standard + 0.25 * Math.log(2),
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "the Box-Muller endpoint guard keeps a zero uniform draw bounded",
    nclose(
      HumanSkill.normal(indexed([0, 0]), 0),
      Math.sqrt(24 * Math.log(10)),
      ROUNDING,
    ),
  );

  const variance: number = 0.025 ** 2 + 0.14 ** 2;
  TestValidator.predicate(
    "zero normal draw gives the log-normal median",
    nclose(
      HumanSkill.jitter(novice, indexed([0.5, 0.25]), 2),
      2 / Math.sqrt(1 + variance / 4),
      ROUNDING,
    ),
  );
  TestValidator.equals(
    "a zero instant draws nothing",
    HumanSkill.jitter(novice, indexed([]), 0),
    0,
  );
}
