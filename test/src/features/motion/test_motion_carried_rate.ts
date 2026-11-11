import { carriedRate } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The carried-rate term leaves a cut at a unit rate without a step in
 * acceleration and is gone, at rest, when its duration ends.
 *
 * Scenarios:
 * 1. Over 0.4 s the term is zero at the cut and at the end, and stays zero
 *    after the end and before the cut.
 * 2. Its slope is 1 at the cut and 0 at the end, and its second difference is
 *    zero at both, read by finite differences of the term itself.
 * 3. It peaks at a third of the duration with `PEAK` durations, 16/81, and
 *    never crosses zero in between.
 * 4. A path from rest plus a rate times the term has that rate at the cut:
 *    a 0.3 m minimum-jerk reach over 0.5 s entered at 1.2 m/s.
 * 5. A non-positive duration and a non-finite elapsed time throw.
 */
export function test_motion_carried_rate(): void {
  const close = (a: number, b: number, e: number): boolean =>
    Math.abs(a - b) <= e;
  const D: number = 0.4;
  TestValidator.predicate(
    "zero at both ends and outside them",
    carriedRate(D, 0) === 0 &&
      close(carriedRate(D, D), 0, 1e-15) &&
      close(carriedRate(D, 2 * D), 0, 1e-15) &&
      carriedRate(D, -1) === 0,
  );

  const h: number = 1e-5;
  const slope = (t: number): number =>
    (carriedRate(D, t + h) - carriedRate(D, t)) / h;
  const bend = (t: number): number =>
    (carriedRate(D, t + 2 * h) -
      2 * carriedRate(D, t + h) +
      carriedRate(D, t)) /
    (h * h);
  TestValidator.predicate(
    "unit slope at the cut, none at the end",
    close(slope(0), 1, 1e-6) && close(slope(D - h), 0, 1e-6),
  );
  TestValidator.predicate(
    "no acceleration at either end",
    close(bend(0), 0, 1e-2) && close(bend(D - 2 * h), 0, 1e-2),
  );

  TestValidator.predicate(
    "peaks at a third with 16/81 durations",
    close(carriedRate.PEAK, 16 / 81, 1e-15) &&
      close(carriedRate(D, D / 3), (16 / 81) * D, 1e-12),
  );
  let positive: boolean = true;
  let most: number = 0;
  for (let k: number = 1; k < 400; k++) {
    const value: number = carriedRate(D, (k * D) / 400);
    positive &&= value > 0;
    most = Math.max(most, value);
  }
  TestValidator.predicate(
    "never crosses zero or exceeds the peak",
    positive && most <= carriedRate.PEAK * D + 1e-12,
  );

  // 10 u^3 - 15 u^4 + 6 u^5, written out so the reach is independent of the engine.
  const reach = (t: number): number => {
    const u: number = t / 0.5;
    return 0.3 * (10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5);
  };
  const joined = (t: number): number => reach(t) + 1.2 * carriedRate(0.5, t);
  TestValidator.predicate(
    "a reach from rest leaves the cut at the entry rate and ends on its goal",
    close((joined(h) - joined(0)) / h, 1.2, 1e-3) &&
      close(joined(0.5), 0.3, 1e-12),
  );

  TestValidator.error("zero duration", (): unknown => carriedRate(0, 0.1));
  TestValidator.error("non-finite elapsed", (): unknown =>
    carriedRate(0.4, NaN),
  );
}
