import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBreath,
  IAutoMovieRandom,
} from "@automovie/interface";
import { HumanBreath } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** The resting rate the cycles are read at, breaths a minute. */
const RATE: number = 15;

/** One sigh every 300 s (Bell et al.), as a share of cycles. */
const SIGH: number = 60 / RATE / 300;

/**
 * `HumanBreath` draws a resting respiratory rate and reads the breathing state
 * at a second: zero volume at each cycle's boundary, a deep breath on a cycle
 * whose sigh draw falls under one sigh per five minutes, and an exertion that
 * raises the rate and recovers it with the phase continuous.
 *
 * Scenarios:
 *
 * 1. 200 resting rates lie in 12 to 20 a minute, their mean 15.24 within 0.4, the
 *    mean of N(15, 2) truncated to [12, 20] (`15 + 2 (phi(-1.5) - phi(2.5)) /
 *    (Phi(2.5) - Phi(-1.5))`), 0.4 three standard errors.
 * 2. At 15 a minute the volume is zero at the boundaries of cycles 0, 1, 7 and 40,
 *    and positive inside cycle 3.
 * 3. The cycle drawn just under the sigh probability breathes deep (over 1.5 of a
 *    tidal breath) at its inspiration's end; the one just over it a tidal
 *    breath, 1.
 * 4. A full exertion at 30 s recovering over 60 s runs at `EXERTION_RATE` just
 *    before it ends, is back at rest by 91 s, and its phase is continuous at
 *    its end.
 * 5. The same inputs read the same volume.
 */
export function test_unit_motions_everyday_human_breath_state(): void {
  const stream: (k: string) => IAutoMovieRandom = (
    k: string,
  ): IAutoMovieRandom =>
    createAutoMovieRandom(deriveAutoMovieSeed("breath", k));
  const rates: number[] = Array.from(
    { length: 200 },
    (_: unknown, i: number): number =>
      HumanBreath.restingRate(stream(`rate${i}`)),
  );
  const mean: number =
    rates.reduce((a: number, b: number): number => a + b, 0) / rates.length;
  TestValidator.predicate(
    `rates in band, mean ${mean}`,
    rates.every((r: number): boolean => r >= 12 && r <= 20) &&
      Math.abs(mean - 15.24) < 0.4,
  );

  const sigh: IAutoMovieRandom = stream("sigh");
  const atCycle: (
    n: number,
    f: number,
  ) => IAutoMovieMotionHumanBreath.IStateResult = (
    n: number,
    f: number,
  ): IAutoMovieMotionHumanBreath.IStateResult =>
    HumanBreath.state(((n + f) * 60) / RATE, RATE, [], 0, sigh);
  TestValidator.predicate(
    "zero at the boundaries, positive inside",
    [0, 1, 7, 40].every(
      (n: number): boolean => Math.abs(atCycle(n, 0).volume) < 1e-9,
    ) &&
      [0.2, 0.42, 0.7].every((f: number): boolean => atCycle(3, f).volume > 0),
  );

  let below: number = -1;
  let above: number = -1;
  for (let cycle: number = 0; cycle < 20000; cycle++) {
    const draw: number = sigh.float(cycle);
    if (draw < SIGH && (below < 0 || draw > sigh.float(below))) below = cycle;
    if (draw >= SIGH && (above < 0 || draw < sigh.float(above))) above = cycle;
  }
  TestValidator.predicate(
    "a deep breath under the sigh's probability, a tidal one over it",
    below >= 0 &&
      atCycle(below, HumanBreath.INSPIRATION).volume > 1.5 &&
      above >= 0 &&
      Math.abs(atCycle(above, HumanBreath.INSPIRATION).volume - 1) < 1e-9,
  );

  const bout: IAutoMovieMotionHumanBreath.IExertion = {
    at: 30,
    level: 1,
    recovery: 60,
  };
  const a: IAutoMovieMotionHumanBreath.IStateResult = HumanBreath.state(
    30 - 1e-6,
    RATE,
    [bout],
    0,
    sigh,
  );
  const b: IAutoMovieMotionHumanBreath.IStateResult = HumanBreath.state(
    30 + 1e-6,
    RATE,
    [bout],
    0,
    sigh,
  );
  TestValidator.predicate(
    "the exertion and its recovery",
    Math.abs(
      HumanBreath.state(29, RATE, [bout], 0, sigh).rate -
        HumanBreath.EXERTION_RATE,
    ) < 1e-9 &&
      Math.abs(HumanBreath.state(91, RATE, [bout], 0, sigh).rate - RATE) <
        1e-9 &&
      Math.abs(b.phase - a.phase) < (HumanBreath.EXERTION_RATE / 60) * 1e-3,
  );
  TestValidator.equals(
    "deterministic",
    HumanBreath.state(12.3, RATE, [bout], 0.4, sigh).volume,
    HumanBreath.state(12.3, RATE, [bout], 0.4, sigh).volume,
  );
}
