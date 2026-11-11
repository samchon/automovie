import { carriedAcceleration } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The carried-acceleration term leaves a cut at rest with a unit
 * acceleration and is gone, at rest, when its duration ends.
 *
 * Scenarios:
 * 1. Over 0.4 s the term is zero at the cut and at the end, and stays zero
 *    after the end and before the cut.
 * 2. Its slope is 0 and its second difference 1 at the cut, and both are zero
 *    at the end, read by finite differences of the term itself.
 * 3. It peaks at two fifths of the duration with `PEAK` squared durations,
 *    54/3125, and never goes below zero in between.
 * 4. A path joined to a parabola with value and rate only, plus the
 *    parabola's acceleration times the term mirrored in time, arrives with
 *    that acceleration: a minimum-jerk descent of 0.02 m over 0.25 s meeting
 *    a claim that bends at 3 m/s^2.
 * 5. A non-positive duration and a non-finite elapsed time throw.
 */
export function test_motion_carried_acceleration(): void {
  const close = (a: number, b: number, e: number): boolean =>
    Math.abs(a - b) <= e;
  const D: number = 0.4;
  TestValidator.predicate(
    "zero at both ends and outside them",
    carriedAcceleration(D, 0) === 0 &&
      close(carriedAcceleration(D, D), 0, 1e-15) &&
      close(carriedAcceleration(D, 2 * D), 0, 1e-15) &&
      carriedAcceleration(D, -1) === 0,
  );

  const h: number = 1e-4;
  const slope = (t: number): number =>
    (carriedAcceleration(D, t + h) - carriedAcceleration(D, t - h)) / (2 * h);
  const bend = (t: number): number =>
    (carriedAcceleration(D, t + h) -
      2 * carriedAcceleration(D, t) +
      carriedAcceleration(D, t - h)) /
    (h * h);
  TestValidator.predicate(
    "at rest with a unit acceleration at the cut",
    close(slope(h), 0, 1e-3) && close(bend(h), 1, 1e-2),
  );
  TestValidator.predicate(
    "at rest without acceleration at the end",
    close(slope(D - h), 0, 1e-6) && close(bend(D - h), 0, 1e-2),
  );

  TestValidator.predicate(
    "peaks at two fifths with 54/3125 squared durations",
    close(carriedAcceleration.PEAK, 54 / 3125, 1e-15) &&
      close(carriedAcceleration(D, 0.4 * D), (54 / 3125) * D * D, 1e-12),
  );
  let positive: boolean = true;
  let most: number = 0;
  for (let k: number = 1; k < 400; k++) {
    const value: number = carriedAcceleration(D, (k * D) / 400);
    positive &&= value > 0;
    most = Math.max(most, value);
  }
  TestValidator.predicate(
    "never crosses zero or exceeds the peak",
    positive && most <= carriedAcceleration.PEAK * D * D + 1e-12,
  );

  // 10 u^3 - 15 u^4 + 6 u^5, written out so the descent is independent of the engine.
  const T: number = 0.25;
  const descent = (t: number): number => {
    const u: number = t / T;
    return 0.02 * (10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5);
  };
  const joined = (t: number): number =>
    descent(t) + 3 * carriedAcceleration(T, T - t);
  TestValidator.predicate(
    "a descent arrives on its goal at rest with the claim's acceleration",
    close(joined(T), 0.02, 1e-12) &&
      close((joined(T) - joined(T - h)) / h, 0, 1e-3) &&
      close(
        (joined(T) - 2 * joined(T - h) + joined(T - 2 * h)) / (h * h),
        3,
        2e-2,
      ),
  );

  TestValidator.error("zero duration", (): unknown =>
    carriedAcceleration(0, 0.1),
  );
  TestValidator.error("non-finite elapsed", (): unknown =>
    carriedAcceleration(0.4, NaN),
  );
}
