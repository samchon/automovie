import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import type { IAutoMovieMotionHumanBreath } from "@automovie/interface";
import { AutoMovieMotionHumanExpression } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

const { HumanBreath } = AutoMovieMotionHumanExpression;

/**
 * Resting respiratory cycles and exercise recovery have a continuous phase.
 *
 * Scenarios:
 * - Resting rates span the 12 to 20 breaths/minute band around a truncated mean of 15.24.
 * - At the cycle boundary volume is zero. Adjacent draws around the 300 s sigh interval separate tidal and deep breaths.
 * - Recovery returns the rate to rest and preserves cumulative phase across the end of exertion.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public state and resting-rate sampler directly.
 * @evidence contracts/development/testing.md#independent-expectations Uses the adult resting band of Cretikos 2008 and the sigh interval of Ramirez 2014. The 0.4 mean tolerance is three standard errors for 200 draws.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite sigh decisions, the ends and interior of a breath, and both sides of recovery.
 * @evidence contracts/development/testing.md#execution-ownership Samples deterministic scalar functions without a performance.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the physiological observations and their units.
 */
export function test_motion_expression_breathing_phase(): void {
  const stream = (k: string) =>
    createAutoMovieRandom(deriveAutoMovieSeed("breath", k));
  const rates: number[] = Array.from(
    { length: 200 },
    (_: unknown, i: number): number =>
      HumanBreath.restingRate(stream(`rate${i}`)),
  );
  TestValidator.predicate(
    "rates in band",
    rates.every((r: number): boolean => r >= 12 && r <= 20),
  );
  const mean: number =
    rates.reduce((a: number, b: number): number => a + b, 0) / rates.length;

  // N(15, 2) truncated to [12, 20] has mean 15 + 2 (phi(-1.5) - phi(2.5)) / (Phi(2.5) - Phi(-1.5)) = 15.24; 0.4 is three standard errors of 200 draws.
  TestValidator.predicate(
    `rate mean ${mean.toFixed(2)} near 15.24`,
    Math.abs(mean - 15.24) < 0.4,
  );

  const sigh = stream("sigh");
  const rate: number = 15;
  const atCycle = (n: number, f: number) =>
    HumanBreath.state(((n + f) * 60) / rate, rate, [], 0, sigh);
  TestValidator.predicate(
    "zero at cycle boundaries",
    [0, 1, 7, 40].every(
      (n: number): boolean => Math.abs(atCycle(n, 0).volume) < 1e-9,
    ),
  );
  TestValidator.predicate(
    "positive inside a cycle",
    [0.2, 0.42, 0.7].every((f: number): boolean => atCycle(3, f).volume > 0),
  );
  // Identify the adjacent real draws straddling one sigh per five minutes,
  // then evaluate the public breathing state only for those two cycles.
  const probability: number = 60 / rate / 300;
  let below: number = -1;
  let above: number = -1;
  for (let cycle = 0; cycle < 20000; cycle++) {
    const draw = sigh.float(cycle);
    if (draw < probability && (below < 0 || draw > sigh.float(below)))
      below = cycle;
    if (draw >= probability && (above < 0 || draw < sigh.float(above)))
      above = cycle;
  }
  TestValidator.predicate(
    "neighbor below the sigh probability produces a deep breath",
    below >= 0 && atCycle(below, HumanBreath.INSPIRATION).volume > 1.5,
  );
  TestValidator.predicate(
    "neighbor above the sigh probability produces an ordinary breath",
    above >= 0 &&
      Math.abs(atCycle(above, HumanBreath.INSPIRATION).volume - 1) < 1e-9,
  );
  const bout: IAutoMovieMotionHumanBreath.IExertion = {
    at: 30,
    level: 1,
    recovery: 60,
  };
  const before = HumanBreath.state(29, rate, [bout], 0, sigh);
  const after = HumanBreath.state(91, rate, [bout], 0, sigh);
  TestValidator.predicate(
    "exertion raises the rate",
    Math.abs(before.rate - HumanBreath.EXERTION_RATE) < 1e-9,
  );
  TestValidator.predicate(
    "recovered after the recovery",
    Math.abs(after.rate - rate) < 1e-9,
  );
  const a = HumanBreath.state(30 - 1e-6, rate, [bout], 0, sigh);
  const b = HumanBreath.state(30 + 1e-6, rate, [bout], 0, sigh);
  TestValidator.predicate(
    "phase continuous at the bout's end",
    Math.abs(b.phase - a.phase) < (HumanBreath.EXERTION_RATE / 60) * 1e-3,
  );
  TestValidator.predicate(
    "deterministic",
    HumanBreath.state(12.3, rate, [bout], 0.4, sigh).volume ===
      HumanBreath.state(12.3, rate, [bout], 0.4, sigh).volume,
  );
}
